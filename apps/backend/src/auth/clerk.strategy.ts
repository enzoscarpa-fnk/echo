import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import type { ClerkClient } from '@clerk/backend'; // ← Utilise "import type"

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(
    private readonly clerkClient: ClerkClient,
  ) {
    super();
  }

  async validate(request: any): Promise<any> {
    // Logique de validation
    return null;
  }
}
