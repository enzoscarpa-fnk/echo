import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
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
     * PATCH /api/users/me
     * Update current user profile (local fields only)
     */
    @Patch('me')
    async updateCurrentUser(
        @Req() req: any,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.updateProfile(req.user.id, updateUserDto);
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

    /**
     * POST /users/status/online
     * Mark user as online (appelé au login/refresh)
     */
    @Post('status/online')
    async setOnline(@Req() req: any) {
        return this.usersService.setUserOnline(req.user.id);
    }

    /**
     * POST /users/status/offline
     * Mark user as offline (appelé au logout/beforeunload)
     */
    @Post('status/offline')
    async setOffline(@Req() req: any) {
        return this.usersService.setUserOffline(req.user.id);
    }

    /**
     * POST /users/status/heartbeat
     * Update last seen (appelé toutes les 30 secondes)
     */
    @Post('status/heartbeat')
    async heartbeat(@Req() req: any) {
        return this.usersService.updateLastSeen(req.user.id);
    }

    /**
     * GET /users/status/contacts
     * Get status of all user's contacts
     */
    @Get('status/contacts')
    async getContactsStatus(@Req() req: any) {
        return this.usersService.getContactsStatus(req.user.id);
    }

    /**
     * POST /users/pusher/auth
     * Authorize Pusher channel subscription
     */
    @Post('pusher/auth')
    async authorizePusher(
        @Body('socket_id') socketId: string,
        @Body('channel_name') channelName: string,
        @Req() req: any,
    ) {
        return this.usersService.authorizeChannel(
            socketId,
            channelName,
            req.user.id,
        );
    }
}
