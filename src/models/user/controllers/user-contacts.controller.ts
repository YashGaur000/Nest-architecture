import { Body, Controller, HttpCode, Patch, Post } from '@nestjs/common';
import { UserContactsService } from '../services/user-contacts.service';
import { UserCreateContactDto } from '../dto/user-create-contact.dto';
import { UserContact } from '../common/user-interfaces';
import { UserUpdateContactDto } from '../dto/user-update-contact.dto';
import { UserGetContact, UserIdentityDto } from '../dto/user.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('user/contacts')
export class UserContactsController {
  constructor(private readonly userContactsService: UserContactsService) {}

  @Post()
  @HttpCode(201)
  createContact(
    @Body() userCreateContactDto: UserCreateContactDto,
  ): Promise<void> {
    return this.userContactsService.createContact(userCreateContactDto);
  }

  @Patch('update')
  @HttpCode(201)
  updateContact(
    @Body() userUpdateContactDto: UserUpdateContactDto,
  ): Promise<void> {
    return this.userContactsService.updateContact(
      userUpdateContactDto.identity,
      userUpdateContactDto.contactId,
      userUpdateContactDto,
    );
  }

  @Post('get-one')
  getContact(@Body() userGetContact: UserGetContact): Promise<UserContact> {
    return this.userContactsService.getContact(
      userGetContact.identity,
      userGetContact.contactId,
    );
  }

  @Post('get-all')
  getContacts(
    @Body() userIdentityDto: UserIdentityDto,
  ): Promise<UserContact[]> {
    return this.userContactsService.getContacts(userIdentityDto.identity);
  }

  @Post('delete')
  @HttpCode(201)
  deleteContact(@Body() userGetContact: UserGetContact): Promise<void> {
    return this.userContactsService.deleteContact(
      userGetContact.identity,
      userGetContact.contactId,
    );
  }
}
