export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
  iat?: number;
  exp?: number;
}
