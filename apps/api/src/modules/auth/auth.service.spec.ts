import { AuthService } from './auth.service';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  it('hashes passwords without storing the clear value', async () => {
    const service = new AuthService({} as never, {} as never, {} as never);
    const password = 'CorrectHorseBatteryStaple!';
    const hash = await service.hashPassword(password);
    expect(hash).not.toBe(password);
    await expect(bcrypt.compare(password, hash)).resolves.toBe(true);
  });
});
