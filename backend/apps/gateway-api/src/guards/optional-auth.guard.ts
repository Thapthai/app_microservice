import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
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

    // Try JWT Authentication first
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return this.authClient.send('auth.validate', token).pipe(
        map((result: any) => {
          if (result.success) {
            request.user = result.data;
            return true;
          }
          // If JWT fails, try client credential
          return this.tryClientCredential(request, clientId, clientSecret);
        }),
        catchError(() => {
          // If JWT fails, try client credential
          return of(this.tryClientCredential(request, clientId, clientSecret));
        })
      );
    }

    // Try Client Credential Authentication
    if (clientId && clientSecret) {
      return this.validateClientCredential(request, clientId, clientSecret);
    }

    // No authentication provided - allow but don't set user
    return true;
  }

  private tryClientCredential(request: any, clientId?: string, clientSecret?: string): boolean {
    if (clientId && clientSecret) {
      // This will be handled asynchronously
      return true;
    }
    return true;
  }

  private validateClientCredential(request: any, clientId: string, clientSecret: string): Observable<boolean> {
    return this.authClient.send('auth.client-credential.validate', {
      client_id: clientId,
      client_secret: clientSecret
    }).pipe(
      map((result: any) => {
        if (!result.success) {
          throw new UnauthorizedException(result.message || 'Invalid client credential');
        }
        
        request.user = result.data.user;
        request.clientCredential = result.data.credential;
        return true;
      }),
      catchError((error) => {
        throw new UnauthorizedException('Client credential validation failed');
      })
    );
  }
}

