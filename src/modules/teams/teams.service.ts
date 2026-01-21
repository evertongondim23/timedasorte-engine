import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo time
   */
  async create(createTeamDto: CreateTeamDto) {
    // Validar que as camisas são únicas
    const uniqueJerseys = new Set(createTeamDto.jerseys);
    if (uniqueJerseys.size !== createTeamDto.jerseys.length) {
      throw new BadRequestException("As camisas devem ser números únicos");
    }

    // Verificar se já existe um time com esse nome
    const existingTeam = await this.prisma.team.findUnique({
      where: { name: createTeamDto.name },
    });

    if (existingTeam) {
      throw new ConflictException(
        `Já existe um time com o nome "${createTeamDto.name}"`
      );
    }

    // Verificar se alguma camisa já está em uso por outro time
    const teamsWithJerseys = await this.prisma.team.findMany({
      where: {
        jerseys: {
          hasSome: createTeamDto.jerseys,
        },
        deletedAt: null,
      },
    });

    if (teamsWithJerseys.length > 0) {
      const conflictingJerseys = teamsWithJerseys.flatMap((t) =>
        t.jerseys.filter((j) => createTeamDto.jerseys.includes(j))
      );
      throw new ConflictException(
        `As camisas ${conflictingJerseys.join(", ")} já estão em uso por outro time`
      );
    }

    return this.prisma.team.create({
      data: {
        name: createTeamDto.name,
        jerseys: createTeamDto.jerseys,
        color: createTeamDto.color || "#000000",
        shield: createTeamDto.shield,
        animal: createTeamDto.animal || "Animal",
        animalEmoji: createTeamDto.animalEmoji || "🐾",
        isActive: createTeamDto.isActive ?? true,
      },
    });
  }

  /**
   * Lista todos os times
   */
  async findAll(includeInactive = false) {
    return this.prisma.team.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Busca um time por ID
   */
  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: parseInt(id, 10), deletedAt: null },
    });

    if (!team) {
      throw new NotFoundException(`Time com ID ${id} não encontrado`);
    }

    return team;
  }

  /**
   * Busca um time por nome
   */
  async findByName(name: string) {
    const team = await this.prisma.team.findUnique({
      where: { name, deletedAt: null },
    });

    if (!team) {
      throw new NotFoundException(`Time "${name}" não encontrado`);
    }

    return team;
  }

  /**
   * Busca time pela camisa
   */
  async findByJersey(jerseyNumber: number) {
    const team = await this.prisma.team.findFirst({
      where: {
        jerseys: {
          has: jerseyNumber,
        },
        deletedAt: null,
        isActive: true,
      },
    });

    if (!team) {
      throw new NotFoundException(
        `Nenhum time encontrado com a camisa ${jerseyNumber}`
      );
    }

    return team;
  }

  /**
   * Atualiza um time
   */
  async update(id: string, updateTeamDto: UpdateTeamDto) {
    await this.findOne(id); // Verifica se existe

    // Se estiver atualizando o nome, verificar duplicidade
    if (updateTeamDto.name) {
      const existingTeam = await this.prisma.team.findFirst({
        where: {
          name: updateTeamDto.name,
          id: { not: parseInt(id, 10) },
          deletedAt: null,
        },
      });

      if (existingTeam) {
        throw new ConflictException(
          `Já existe um time com o nome "${updateTeamDto.name}"`
        );
      }
    }

    // Se estiver atualizando as camisas, verificar duplicidade e conflitos
    if (updateTeamDto.jerseys) {
      const uniqueJerseys = new Set(updateTeamDto.jerseys);
      if (uniqueJerseys.size !== updateTeamDto.jerseys.length) {
        throw new BadRequestException("As camisas devem ser números únicos");
      }

      const teamsWithJerseys = await this.prisma.team.findMany({
        where: {
          jerseys: {
            hasSome: updateTeamDto.jerseys,
          },
          id: { not: parseInt(id, 10) },
          deletedAt: null,
        },
      });

      if (teamsWithJerseys.length > 0) {
        const conflictingJerseys = teamsWithJerseys.flatMap((t) =>
          t.jerseys.filter((j) => updateTeamDto.jerseys!.includes(j))
        );
        throw new ConflictException(
          `As camisas ${conflictingJerseys.join(", ")} já estão em uso`
        );
      }
    }

    return this.prisma.team.update({
      where: { id: parseInt(id, 10) },
      data: updateTeamDto,
    });
  }

  /**
   * Remove um time (soft delete)
   */
  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    // TODO: Verificar apostas quando BetsModule estiver implementado
    // const betsCount = await this.prisma.bet.count({
    //   where: { teamId: parseInt(id, 10) },
    // });
    // if (betsCount > 0) {
    //   throw new BadRequestException(
    //     `Não é possível remover o time pois existem ${betsCount} apostas associadas`,
    //   );
    // }

    return this.prisma.team.update({
      where: { id: parseInt(id, 10) },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Ativa ou desativa um time
   */
  async toggleActive(id: string) {
    const team = await this.findOne(id);

    return this.prisma.team.update({
      where: { id: parseInt(id, 10) },
      data: {
        isActive: !team.isActive,
      },
    });
  }

  /**
   * Lista apenas times ativos
   */
  async findAllActive() {
    return this.findAll(false);
  }

  /**
   * Busca times por cor
   */
  async findByColor(color: string) {
    return this.prisma.team.findMany({
      where: {
        color,
        deletedAt: null,
        isActive: true,
      },
    });
  }

  /**
   * Estatísticas do time (apostas, vitórias, etc)
   */
  async getStats(id: string) {
    const team = await this.findOne(id);

    // TODO: Implementar estatísticas quando BetsModule e DrawsModule estiverem prontos
    const totalBets = 0;
    const wonBets = 0;
    const timesDrawn = 0;

    return {
      team,
      stats: {
        totalBets,
        wonBets,
        winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
        timesDrawn,
      },
    };
  }
}
