import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthGuard } from "src/shared/auth/guards/auth.guard";
import { RequiredRoles } from "src/shared/auth/required-roles.decorator";
import { Roles } from "@prisma/client";
import { RoleGuard } from "src/shared/auth/guards/role.guard";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { TenantInterceptor } from "src/shared/tenant/tenant.interceptor";
import { CurrentUser } from "src/shared/auth/decorators/current-user.decorator";
import { UserPayload } from "src/shared/auth/interfaces/user-payload.interface";

// 🎯 CASL Decorators
import {
  CaslRead,
  CaslCreate,
  CaslUpdate,
  CaslDelete,
} from "src/shared/casl/decorators/casl.decorator";
import { CaslInterceptor } from "src/shared/casl/interceptors/casl.interceptor";

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor, CaslInterceptor)
@Controller("users")
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ============================================================================
  // 📋 CRUD BÁSICO DE USUÁRIOS
  // ============================================================================

  @Get()
  @CaslRead("User")
  @RequiredRoles(Roles.ADMIN)
  buscarTodos(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
    @Query("orderBy") orderBy: string = "name",
    @Query("orderDirection") orderDirection: "asc" | "desc" = "asc"
  ) {
    return this.service.buscarTodos(
      Number(page),
      Number(limit),
      orderBy,
      orderDirection
    );
  }

  // ============================================================================
  // 👤 PERFIL DO USUÁRIO ATUAL (DEVE VIR ANTES DE /:id)
  // ============================================================================

  @Get("me")
  getMyProfile(@CurrentUser() user: UserPayload) {
    return this.service.buscarPorId(user.id);
  }

  @Patch("me")
  @CaslUpdate("User")
  updateMyProfile(
    @CurrentUser() user: UserPayload,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.service.atualizarPerfil(user.id, updateProfileDto);
  }

  @Get("search")
  @CaslRead("User")
  @RequiredRoles(Roles.ADMIN)
  buscarUsuarios(
    @Query("q") query: string = "",
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
    @Query("orderBy") orderBy: string = "name",
    @Query("orderDirection") orderDirection: "asc" | "desc" = "asc"
  ) {
    return this.service.buscarUsuarios(
      query,
      Number(page),
      Number(limit),
      orderBy,
      orderDirection
    );
  }

  @Get(":id")
  @CaslRead("User")
  @RequiredRoles(Roles.ADMIN, Roles.USER, Roles.SYSTEM_ADMIN, Roles.OPERATOR)
  buscarPorId(@Param("id") id: string) {
    return this.service.buscarPorId(id);
  }

  @Patch(":id")
  @CaslUpdate("User")
  @RequiredRoles(Roles.ADMIN)
  atualizar(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.service.atualizar(id, updateUserDto);
  }

  @Delete(":id")
  @CaslDelete("User")
  @RequiredRoles(Roles.ADMIN)
  desativar(@Param("id") id: string) {
    return this.service.desativar(id);
  }

  @Post(":id/reativar")
  @CaslUpdate("User")
  @RequiredRoles(Roles.ADMIN)
  reativar(@Param("id") id: string) {
    return this.service.reativar(id);
  }

  // ============================================================================
  // 👥 CRIAÇÃO DE USUÁRIOS POR TIPO
  // ============================================================================

  @Post("admin")
  @CaslCreate("User")
  @RequiredRoles(Roles.ADMIN)
  criarNovoAdmin(@Body() dto: CreateAdminDto) {
    return this.service.criarNovoAdmin(dto);
  }

  @Post("user")
  @CaslCreate("User")
  criarNovoUser(@Body() dto: any) {
    return this.service.criarNovoUser(dto);
  }

  // ============================================================================
  // 🔍 BUSCA POR CRITÉRIOS ESPECÍFICOS
  // ============================================================================

  @Get("email/:email")
  @CaslRead("User")
  @RequiredRoles(Roles.ADMIN)
  buscarPorEmail(@Param("email") email: string) {
    return this.service.buscarUserPorEmail(email);
  }

  @Get("company/:companyId")
  @CaslRead("User")
  @RequiredRoles(Roles.ADMIN)
  buscarPorCompany(@Param("companyId") companyId: string) {
    return this.service.buscarUsersPorCompany(companyId);
  }

  @Get("role/:role")
  @CaslRead("User")
  @RequiredRoles(Roles.ADMIN)
  buscarPorRole(@Param("role") role: Roles) {
    return this.service.buscarUsersPorRole(role);
  }
}
