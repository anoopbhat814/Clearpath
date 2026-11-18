import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  const mw = new RequestIdMiddleware();

  it('reuses a well-formed incoming id', () => {
    const req: any = { headers: { 'x-request-id': 'abc12345-def' } };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();
    mw.use(req, res, next);
    expect(req.requestId).toBe('abc12345-def');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'abc12345-def');
    expect(next).toHaveBeenCalled();
  });

  it('generates an id when the header is malformed', () => {
    const req: any = { headers: { 'x-request-id': '<script>' } };
    mw.use(req, { setHeader: jest.fn() } as any, jest.fn());
    expect(req.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
