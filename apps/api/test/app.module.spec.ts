import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

describe('AppModule wiring', () => {
  it('resolves the JWT guard from the application module graph', async () => {
    const testingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();

    expect(testingModule.get(JwtAuthGuard)).toBeInstanceOf(JwtAuthGuard);
    await testingModule.close();
  });
});
