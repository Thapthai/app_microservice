import { Test, TestingModule } from '@nestjs/testing';
import { ItemServiceController } from './item-service.controller';
import { ItemServiceService } from './item-service.service';

describe('ItemServiceController', () => {
  let itemServiceController: ItemServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ItemServiceController],
      providers: [ItemServiceService],
    }).compile();

    itemServiceController = app.get<ItemServiceController>(ItemServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(itemServiceController.getHello()).toBe('Hello World!');
    });
  });
});
