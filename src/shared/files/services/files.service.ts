import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import * as Minio from 'minio';

export interface FileInfo {
  id: string;
  originalName: string;
  fileName: string;
  type: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedBy: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucketName = 'jogo-da-sorte-files';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      // useSSL: this.configService.get<boolean>('MINIO_USE_SSL', false),
      accessKey: this.configService.get<string>('MINIO_ROOT_USER', 'admin'),
      secretKey: this.configService.get<string>('MINIO_ROOT_PASSWORD', 'password123'),
    });

    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' criado com sucesso`);
      }

      // Configurar política de acesso público para leitura
      const publicReadPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(publicReadPolicy),
      );
      this.logger.log(`Política de acesso público configurada para bucket '${this.bucketName}'`);
    } catch (error) {
      this.logger.error(`Erro ao inicializar bucket: ${error.message}`);
    }
  } 

  async uploadFile(
    file: any,
    type: string,
    uploadedBy?: string,
    description?: string,
  ): Promise<FileInfo> {
    try {
      // Gerar nome único para o arquivo
      const fileName = `${Date.now()}-${file.originalname}`;
      const folder = 'files';
      const fullPath = `${folder}/${fileName}`;

      // Upload para MinIO
      await this.minioClient.putObject(
        this.bucketName,
        fullPath,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );

      // URL pública
      const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000'); 
      const url = `${minioEndpoint}/${this.bucketName}/${fullPath}`;

      // Salvar no banco
      const fileRecord = await this.prisma.file.create({
        data: {
          originalName: file.originalname,
          fileName: fullPath,
          type: type as any,
          size: file.size,
          mimeType: file.mimetype,
          url,
          uploadedBy,
          description,
        },
      });

      this.logger.log(`Arquivo enviado com sucesso: ${fileRecord.id}`);
      return fileRecord;
    } catch (error) {
      this.logger.error(`Erro ao fazer upload: ${error.message}`);
      throw new Error(`Falha no upload: ${error.message}`);
    }
  }

  async getAllFiles(page = 1, limit = 20): Promise<{ files: FileInfo[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [files, total] = await Promise.all([
        this.prisma.file.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.file.count(),
      ]);

      return { files, total };
    } catch (error) {
      this.logger.error(`Erro ao buscar arquivos: ${error.message}`);
      throw error;
    }
  }

  async getFileById(id: string): Promise<FileInfo> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id },
      });

      if (!file) {
        throw new Error('Arquivo não encontrado');
      }

      return file;
    } catch (error) {
      this.logger.error(`Erro ao buscar arquivo: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id },
      });

      if (!file) {
        throw new Error('Arquivo não encontrado');
      }

      // Deletar do MinIO
      await this.minioClient.removeObject(this.bucketName, file.fileName);

      // Deletar do banco
      await this.prisma.file.delete({
        where: { id },
      });

      this.logger.log(`Arquivo deletado: ${id}`);
    } catch (error) {
      this.logger.error(`Erro ao deletar arquivo: ${error.message}`);
      throw error;
    }
  }
}
