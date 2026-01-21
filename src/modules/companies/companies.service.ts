import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
// dto imports
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ConflictError } from '../../shared/common/errors';
// universal imports
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
  createEntityConfig,
} from '../../shared/universal/index';

@Injectable({ scope: Scope.REQUEST })
export class CompaniesService extends UniversalService<
  CreateCompanyDto,
  UpdateCompanyDto
> {
  private static readonly entityConfig = createEntityConfig('company');

  constructor(
    repository: UniversalRepository<CreateCompanyDto, UpdateCompanyDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) request: any,
  ) {
    const { model, casl } = CompaniesService.entityConfig;
    super(
      repository,
      queryService,
      permissionService,
      metricsService,
      request,
      model,
      casl,
    );
  }

  protected async antesDeCriar(data: CreateCompanyDto): Promise<void> {
    if (data.cnpj) await this.validarCNPJ(data.cnpj);
  }

  protected async antesDeAtualizar(
    id: string,
    data: UpdateCompanyDto,
  ): Promise<void> {
    if (data.cnpj) await this.validarCNPJ(data.cnpj);
  }

  private async validarCNPJ(cnpj: string): Promise<void> {
    const existingCompany = await this.repository.buscarPrimeiro(
      this.entityName,
      { cnpj },
    );
    if (existingCompany) {
      throw new ConflictError('CNPJ já está em uso');
    }
  }
}
