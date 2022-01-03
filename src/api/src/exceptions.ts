export class HaltException extends Error {}

export class HttpException extends Error {
  status: number;

  message: string;

  detail_code: string;

  constructor(status: number, detail: string, detail_code: string = null) {
    super(detail);
    this.status = status;
    this.message = detail;
    this.detail_code = detail_code;
  }
}

export class HttpForbidden extends HttpException {
  constructor(detail = 'forbidden', detail_code = 'forbidden') {
    super(403, detail, detail_code);
  }
}

export class HttpBadRequest extends HttpException {
  constructor(detail = 'bad request', detail_code = 'bad_request') {
    super(400, detail, detail_code);
  }
}

export class HttpNotFound extends HttpException {
  constructor(detail = 'not found', detail_code = 'not_found') {
    super(404, detail, detail_code);
  }
}
