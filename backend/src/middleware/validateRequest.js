export function validateRequest(schemas) {
  return (req, _res, next) => {
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part]);
      if (!result.success) return next(result.error);
      if (part === 'body') req.body = result.data;
      else req.validatedQuery = result.data;
    }
    return next();
  };
}
