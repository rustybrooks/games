import { Request } from 'express';

export function getParams(request: Request) {
  console.log(request.query, request.body);
  return { ...request.query, ...request.body };
}
