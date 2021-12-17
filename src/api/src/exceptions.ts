export class HaltException extends Error {}

export class HttpException extends Error {
  status: number;

  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export class HttpForbidden extends HttpException {
  constructor(message = 'forbidden') {
    super(403, message);
  }
}

export class HttpBadRequest extends HttpException {
  constructor(message = 'bad request') {
    super(400, message);
  }
}

export class HttpNotFound extends HttpException {
  constructor(message = 'not found') {
    super(404, message);
  }
}
