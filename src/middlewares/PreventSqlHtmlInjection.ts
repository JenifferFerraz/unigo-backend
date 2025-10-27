import { Request, Response, NextFunction } from 'express';

// Padrões expandidos para detectar SQL Injection e XSS
const sqlHtmlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|CAST|CONVERT)\b)|(<script|<iframe|<object|<embed|<img|javascript:|onerror=|onload=|eval\(|expression\()/gi;

export function preventSqlHtmlInjection(req: Request, res: Response, next: NextFunction) {
  const checkObject = (obj: any): boolean => {
    if (!obj) return false;
    
    for (const key in obj) {
      const value = obj[key];
      
      // Verifica strings
      if (typeof value === 'string') {
        if (sqlHtmlInjectionPattern.test(value)) {
          return true;
        }
        
        // Verifica múltiplos sinais suspeitos
        if (value.includes('--') || value.includes('/*') || value.includes('*/') || 
            value.includes('xp_') || value.includes('sp_')) {
          return true;
        }
      }
      
      // Verifica objetos aninhados recursivamente
      if (typeof value === 'object' && value !== null) {
        if (checkObject(value)) {
          return true;
        }
      }
    }
    
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    res.status(400).json({
      error: 'Entrada inválida detectada. Por favor, revise os dados enviados.',
      message: 'Campos não podem conter comandos SQL, scripts maliciosos ou caracteres perigosos.'
    });
    return;
  }
  
  next();
}
