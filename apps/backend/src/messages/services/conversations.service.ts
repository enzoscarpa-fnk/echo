import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { User } from '../../auth/entities/user.entity';
import { CreateConversationDto } from '../dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly conversationParticipantRepository: Repository<ConversationParticipant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createConversationDto: CreateConversationDto): Promise<Conversation> {
    const { participantIds, ...conversationData } = createConversationDto;

    // Vérifier que tous les participants existent
    const participants = await this.userRepository.find({
      where: { id: In(participantIds) },
    });

    if (participants.length !== participantIds.length) {
      throw new NotFoundException('One or more participants not found');
    }

    // Créer la conversation
    const conversation = this.conversationRepository.create(conversationData);
    const savedConversation = await this.conversationRepository.save(conversation);

    // Ajouter les participants via la table de liaison
    const conversationParticipants = participantIds.map(userId =>
      this.conversationParticipantRepository.create({
        conversationId: savedConversation.id,
        userId: userId,
      })
    );

    await this.conversationParticipantRepository.save(conversationParticipants);

    return savedConversation;
  }

  async findAllByUser(userId: string): Promise<any[]> {
    // Trouver toutes les conversations où l'utilisateur participe
    const userConversations = await this.conversationParticipantRepository
      .createQueryBuilder('cp')
      .leftJoinAndSelect('cp.conversationId', 'conversation')
      .where('cp.userId = :userId', { userId })
      .getMany();

    // Pour l'instant, retourner un tableau simple
    // On enrichira plus tard avec les messages et autres participants
    return userConversations.map(uc => ({
      id: uc.conversationId,
      userId: uc.userId,
      joinedAt: uc.joinedAt,
    }));
  }

  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async getParticipants(conversationId: string): Promise<User[]> {
    const participants = await this.conversationParticipantRepository
      .createQueryBuilder('cp')
      .leftJoinAndSelect(User, 'user', 'user.id = cp.userId')
      .where('cp.conversationId = :conversationId', { conversationId })
      .getRawMany();

    return participants.map(p => ({
      id: p.user_id,
      email: p.user_email,
      firstName: p.user_firstName,
      lastName: p.user_lastName,
      avatar: p.user_avatar,
      clerkId: p.user_clerkId,
      isActive: p.user_isActive,
      createdAt: p.user_createdAt,
      updatedAt: p.user_updatedAt,
    } as User));
  }
}
