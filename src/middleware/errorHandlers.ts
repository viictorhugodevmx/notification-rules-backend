import type {
  ErrorRequestHandler,
  RequestHandler,
} from 'express';

function getErrorType(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof error.type === 'string'
  ) {
    return error.type;
  }

  return null;
}

export const handleRouteNotFound: RequestHandler = (
  _request,
  response
) => {
  response.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'La ruta solicitada no existe.',
    },
  });
};

export const handleApiError: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const errorType = getErrorType(error);

  if (errorType === 'entity.parse.failed') {
    response.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'El cuerpo contiene JSON mal formado.',
      },
    });
    return;
  }

  if (errorType === 'entity.too.large') {
    response.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'El cuerpo de la solicitud es demasiado grande.',
      },
    });
    return;
  }

  console.error('[API_ERROR] Error interno:', error);

  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error interno del servidor.',
    },
  });
};
