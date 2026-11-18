import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HttpExceptionFilter } from './http-exception.filter';

function run(exception: unknown) {
  const json = jest.fn();
  const res = { status: jest.fn().mockReturnValue({ json }) };
  const host: any = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ method: 'GET', url: '/x', originalUrl: '/api/x', requestId: 'r1' }),
    }),
  };
  new HttpExceptionFilter().catch(exception, host);
  return { status: res.status.mock.calls[0][0], body: json.mock.calls[0][0] };
}

describe('HttpExceptionFilter', () => {
  it('passes through HttpException status and message', () => {
    const { status, body } = run(new HttpException('nope', HttpStatus.FORBIDDEN));
    expect(status).toBe(403);
    expect(body.message).toBe('nope');
    expect(body.requestId).toBe('r1');
  });

  it('maps unique violations to 409', () => {
    const err = new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' });
    expect(run(err).status).toBe(409);
  });

  it('maps missing records to 404', () => {
    const err = new Prisma.PrismaClientKnownRequestError('gone', { code: 'P2025', clientVersion: '5' });
    expect(run(err).status).toBe(404);
  });

  it('hides unknown error details', () => {
    const { status, body } = run(new Error('db password leaked'));
    expect(status).toBe(500);
    expect(body.message).toBe('Internal server error');
  });
});
