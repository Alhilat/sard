import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse';
import * as svc from './courses.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const listCourses = asyncHandler(async (req, res) => { const r = await svc.listCourses(req.query as any); sendPaginated(res, r.courses, r.pagination); });
export const createCourse = asyncHandler(async (req, res) => { sendCreated(res, await svc.createCourse(req.user!.userId, req.body), 'Course created'); });
export const getCourse = asyncHandler(async (req, res) => { sendSuccess(res, await svc.getCourse(p(req, 'id'))); });
export const updateCourse = asyncHandler(async (req, res) => { sendSuccess(res, await svc.updateCourse(p(req, 'id'), req.user!.userId, req.body), 'Course updated'); });
export const enroll = asyncHandler(async (req, res) => { sendCreated(res, await svc.enroll(p(req, 'id'), req.user!.userId), 'Enrolled'); });
export const cancelEnrollment = asyncHandler(async (req, res) => { sendSuccess(res, await svc.cancelEnrollment(p(req, 'id'), req.user!.userId)); });
export const getEnrollments = asyncHandler(async (req, res) => { const r = await svc.getEnrollments(p(req, 'id'), req.user!.userId, req.query as any); sendPaginated(res, r.enrollments, r.pagination); });
export const addMaterial = asyncHandler(async (req, res) => { sendCreated(res, await svc.addMaterial(p(req, 'id'), req.user!.userId, req.body), 'Material added'); });
export const removeMaterial = asyncHandler(async (req, res) => { sendSuccess(res, await svc.removeMaterial(p(req, 'materialId'), req.user!.userId)); });
