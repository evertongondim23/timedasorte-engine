import { Request } from "express";

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId?: string;
    [key: string]: any;
  };
}
