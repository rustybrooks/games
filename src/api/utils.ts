import { Request } from 'express';

export function getParams(request: Request) {
  return { ...request.params, ...request.body };
}
