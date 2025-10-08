import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('users')
@UseGuards(ClerkAuthGuard) // Protect all routes with authentication
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    /**
     * GET /api/users/me
     * Get current authenticated user
     */
    @Get('me')
    async getCurrentUser(@Req() req: any) {
        // req.user already contains the full User object from the database
        // It's populated by ClerkAuthGuard after verifying the token
        return req.user;
    }

    /**
     * GET /api/users/search?query=john
     * Search users by name or email
     */
    @Get('search')
    async search(@Query('query') query: string, @Req() req: any) {
        // req.user.id is the internal database ID (UUID)
        return this.usersService.search(query, req.user.id);
    }

    /**
     * GET /api/users
     * Get all users (excluding current user)
     */
    @Get()
    async findAll(@Req() req: any) {
        // req.user.id is the internal database ID (UUID)
        return this.usersService.findAll(req.user.id);
    }

    /**
     * GET /api/users/:id
     * Get a specific user by ID
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }
}
