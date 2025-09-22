import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../../auth/entities/user.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';

// Interface pour le message enrichi avec sender
interface MessageWithSender {
  id: string;
  content: string;
  type: string;
  attachmentUrl?: string;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  senderId: string;
  conversationId: string;
  sender: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<MessageWithSender> {
    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({
      where: { id: createMessageDto.senderId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const message = this.messageRepository.create(createMessageDto);
    const savedMessage = await this.messageRepository.save(message);

    // Retourner le message avec les informations du sender
    return {
      ...savedMessage,
      sender: {
        id: user.id,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }

  async findAllByConversation(conversationId: string): Promise<MessageWithSender[]> {
    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    // Enrichir avec les informations des senders - avec type explicite
    const enrichedMessages: MessageWithSender[] = [];

    for (const message of messages) {
      const user = await this.userRepository.findOne({
        where: { id: message.senderId }
      });

      if (user) {
        enrichedMessages.push({
          ...message,
          sender: {
            id: user.id,
            fullName: user.fullName,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
          },
        });
      }
    }

    return enrichedMessages;
  }

  async findOne(id: string): Promise<MessageWithSender> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Enrichir avec les informations du sender
    const user = await this.userRepository.findOne({
      where: { id: message.senderId }
    });

    if (!user) {
      throw new NotFoundException('User not found for this message');
    }

    return {
      ...message,
      sender: {
        id: user.id,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    userId: string,
  ): Promise<MessageWithSender> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    Object.assign(message, updateMessageDto);
    message.isEdited = true;
    message.editedAt = new Date();

    const savedMessage = await this.messageRepository.save(message);

    // Enrichir avec les informations du sender
    const user = await this.userRepository.findOne({
      where: { id: savedMessage.senderId }
    });

    if (!user) {
      throw new NotFoundException('User not found for this message');
    }

    return {
      ...savedMessage,
      sender: {
        id: user.id,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageRepository.remove(message);
  }
}
