import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class ClientCredentialGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientId = request.headers['client_id'];
    const clientSecret = request.headers['client_secret'];

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException('client_id and client_secret headers are required');
    }

    // Validate client credential with auth service
    return this.authClient.send('auth.client-credential.validate', { 
      client_id: clientId, 
      client_secret: clientSecret 
    }).pipe(
      map((result: any) => {
        if (!result.success) {
          throw new UnauthorizedException(result.message || 'Invalid client credential');
        }
        
        // Attach user data to request for use in controllers
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

