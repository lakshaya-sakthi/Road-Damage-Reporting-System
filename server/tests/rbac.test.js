import { jest } from '@jest/globals';
import { authorize, enforceServiceArea, enforceWorkerScope } from '../src/middleware/rbac.js';

describe('Role-Based Access Control (RBAC) Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('blocks unauthenticated requests without req.user', () => {
    req = {};
    const middleware = authorize('admin', 'supervisor');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Authentication required')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks unauthorized role (field_inspector trying to access admin endpoint)', () => {
    req = { user: { role: 'field_inspector', name: 'Alex' } };
    const middleware = authorize('admin', 'supervisor');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Forbidden. Role \'field_inspector\' is not authorized')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('permits authorized roles (supervisor accessing supervisor endpoint)', () => {
    req = { user: { role: 'supervisor', name: 'Marcus' } };
    const middleware = authorize('admin', 'supervisor');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('enforceServiceArea sets filter for supervisor but leaves admin unconstrained', () => {
    // Supervisor case
    const supReq = { user: { role: 'supervisor', serviceArea: 'Central District' } };
    enforceServiceArea(supReq, res, next);
    expect(supReq.serviceAreaFilter).toBe('Central District');
    expect(next).toHaveBeenCalledTimes(1);

    // Admin case
    const adminReq = { user: { role: 'admin' } };
    enforceServiceArea(adminReq, res, next);
    expect(adminReq.serviceAreaFilter).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('enforceWorkerScope attaches workerScopeId for workers', () => {
    const workerReq = { user: { role: 'worker', _id: 'worker-id-123' } };
    enforceWorkerScope(workerReq, res, next);
    expect(workerReq.workerScopeId).toBe('worker-id-123');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
