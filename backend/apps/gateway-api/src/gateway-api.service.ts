import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterDto, LoginDto } from './gateway-api.controller';

@Injectable()
export class GatewayApiService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('ITEM_SERVICE') private readonly itemClient: ClientProxy,
  ) { }

  getHello(): string {
    return 'Gateway API is running!';
  }

  async register(registerDto: RegisterDto) {
    return this.authClient.send('auth.register', registerDto).toPromise();
  }

  async login(loginDto: LoginDto) {
    return this.authClient.send('auth.login', loginDto).toPromise();
  }

  async validateToken(token: string) {
    return this.authClient.send('auth.validate', token).toPromise();
  }

  // Item Service Methods
  async createItem(createItemDto: any) {
    return this.itemClient.send('item.create', createItemDto).toPromise();
  }

  async findAllItems(query: any = {}) {
    return this.itemClient.send('item.findAll', query).toPromise();
  }

  async findOneItem(id: number) {
    return this.itemClient.send('item.findOne', id).toPromise();
  }

  async updateItem(id: number, updateItemDto: any) {
    return this.itemClient.send('item.update', { id, updateItemDto }).toPromise();
  }

  async removeItem(id: number) {
    return this.itemClient.send('item.remove', id).toPromise();
  }

  async findItemsByUser(userId: number) {
    return this.itemClient.send('item.findByUser', userId).toPromise();
  }
}
