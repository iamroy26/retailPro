import { asyncRoute } from '../lib/errors.js';
import * as resourceService from '../services/resourceService.js';

export const list = asyncRoute(async (req, res) => {
  res.json(await resourceService.list(req.params.resource, req.user.id, req.query));
});

export const count = asyncRoute(async (req, res) => {
  res.json({ count: await resourceService.count(req.params.resource, req.user.id, req.query) });
});

export const aggregate = asyncRoute(async (req, res) => {
  res.json(await resourceService.aggregate(req.params.resource, req.user.id, req.query));
});

export const get = asyncRoute(async (req, res) => {
  res.json(await resourceService.get(req.params.resource, req.user.id, req.params.id));
});

export const create = asyncRoute(async (req, res) => {
  res.status(201).json(await resourceService.create(req.params.resource, req.user.id, req.body));
});

export const update = asyncRoute(async (req, res) => {
  res.json(await resourceService.update(req.params.resource, req.user.id, req.params.id, req.body));
});

export const remove = asyncRoute(async (req, res) => {
  res.json(await resourceService.remove(req.params.resource, req.user.id, req.params.id));
});

export const removeMany = asyncRoute(async (req, res) => {
  res.json(await resourceService.removeMany(req.params.resource, req.user.id, req.query));
});

export const supplierPurchases = asyncRoute(async (req, res) => {
  res.json(await resourceService.supplierPurchases(
    req.user.id,
    req.params.id,
    req.query.name,
    req.query.limit,
  ));
});
