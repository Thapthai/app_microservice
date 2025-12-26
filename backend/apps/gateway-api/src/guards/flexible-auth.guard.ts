import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class FlexibleAuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const clientId = request.headers['client_id'];
    const clientSecret = request.headers['client_secret'];

    // Priority 1: Try Client Credential Authentication (client_id/client_secret)
    if (clientId && clientSecret) {
      return this.validateClientCredential(request, clientId, clientSecret);
    }

    // Priority 2: Try JWT Authentication (Bearer token)
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return this.validateJWT(request, token);
    }

    // No authentication provided
    throw new UnauthorizedException('Authentication required. Provide either Bearer token or client_id/client_secret headers');
  }

  private validateJWT(request: any, token: string): Observable<boolean> {
    return this.authClient.send('auth.validate', token).pipe(
      map((result: any) => {
        if (!result.success) {
          throw new UnauthorizedException(result.message || 'Invalid token');
        }
        
        request.user = result.data.user;
        return true;
      }),
      catchError((error) => {
        throw new UnauthorizedException('Token validation failed');
      })
    );
  }

  private validateClientCredential(request: any, clientId: string, clientSecret: string): Observable<boolean> {
    // Check if client_secret looks like a hash (starts with $2b$, $2a$, etc.)
    if (clientSecret.startsWith('$2')) {
      throw new UnauthorizedException('Invalid client_secret format. Please use the plain text client_secret (not the hash). The client_secret should be the original value returned when creating the credential.');
    }

    return this.authClient.send('auth.client-credential.validate', {
      client_id: clientId,
      client_secret: clientSecret
    }).pipe(
      map((result: any) => {
        if (!result.success) {
          // If admin validation fails, allow request to pass (will check staff in controller)
          request.clientIdForStaffCheck = clientId; // Store client_id for staff check
          return true;
        }
        
        // Admin credential validated successfully
        request.user = result.data.user;
        request.clientCredential = {
          ...result.data.credential,
          user: result.data.user,
          userType: result.data.userType
        };
        return true;
      }),
      catchError((error) => {
        // If error occurs, allow request to pass (will check staff in controller)
        request.clientIdForStaffCheck = clientId; // Store client_id for staff check
        return of(true); // Return Observable<boolean>
      })
    );
  }
}

