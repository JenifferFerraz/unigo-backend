import { Request, Response, NextFunction } from 'express';

const sqlHtmlInjectionPattern = /select\s|insert\s|update\s|delete\s|<script>|<html>|<body>/i;

export function preventSqlHtmlInjection(req: Request, res: Response, next: NextFunction) {
  const checkObject = (obj: any) => {
    if (!obj) return false;
    for (const key in obj) {
      if (typeof obj[key] === 'string' && sqlHtmlInjectionPattern.test(obj[key])) {
        return true;
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    res.status(400).json({
      error: 'Campos não podem conter comandos SQL ou HTML.'
    });
    return;
  }
  next();
}
