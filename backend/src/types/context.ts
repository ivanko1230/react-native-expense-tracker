import { Request } from 'express';
import { IUser } from '../models/User';

export interface GraphQLContext {
  req: Request;
  user: IUser | null;
}
