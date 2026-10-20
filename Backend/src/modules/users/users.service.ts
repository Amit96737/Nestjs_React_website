import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { RedisService } from '../../integrations/redis/redis.service.js';
import { MailService } from '../../integrations/mail/mail.service.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { VerifyForgotPasswordOtpDto } from './dto/verify-forgot-password-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import twilio from 'twilio';


import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);


  async sendOtp(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.redisService.setOtp(email, otp);

    await this.mailService.sendOtpEmail(email, otp);

    return otp;
  }


  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
    where: {
      email: createUserDto.email,
    },
  });

  if (existingUser) {

    if(!existingUser.email_verified){
      await this.sendOtp(existingUser.email);

      const { password, ...userWithoutPassword } = existingUser;

      return {
        message:
          'Account already exists but email is not verified. A new OTP has been sent to your registered email. Please verify your account.',
        data: userWithoutPassword,
      };
      
    }
    throw new BadRequestException('Email already exists');
  }


    await this.sendOtp(createUserDto.email);

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      10,
    );

    const user = await this.prisma.user.create({
      data: {
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        email: createUserDto.email,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = user;

    return {
      message: 'User created successfully, OTP send register email address please verify your account first',
      data: userWithoutPassword,
    };
  }


  
  async createAdmin(CreateAdminDto: CreateAdminDto) {
  const existingUser = await this.prisma.admin.findUnique({
  where: {
    email: CreateAdminDto.email,
  },
  });

  if (existingUser) {
      return {
        message:
          'Account with this email already exists.',
        
      };
    }  


    // await this.sendOtp(createUserDto.email);

    const hashedPassword = await bcrypt.hash(
      CreateAdminDto.password,
      10,
    );

    const user = await this.prisma.admin.create({
      data: {
        user_name: CreateAdminDto.user_name,
        email: CreateAdminDto.email,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = user;

    return {
      message: 'Admin created successfully.',
      data: userWithoutPassword,
    };
  }



  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const storedOtp = await this.redisService.getOtp(email);

    if (!storedOtp) {
      throw new BadRequestException('OTP expired or not found');
    }

    if (storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.redisService.deleteOtp(email);

    const user = await this.prisma.user.update({
      where: {
        email,
      },
      data: {
        email_verified: true,
      },
    });

    const { password, ...userWithoutPassword } = user;

    return {
      message: 'Email verified successfully',
      data: userWithoutPassword,
    };
  }



async signIn(loginDto: LoginDto) {
  const { email, password } = loginDto;

  const user = await this.prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return {
      message: 'Invalid email or password',
    };
  }

  if (!user.email_verified) {
    return {
      message: 'Please verify your email before signing in',
    };
  }

  if (!user.is_active) {
    return {
      message: 'User account is inactive',
    };
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.password,
  );

  if (!passwordMatch) {
    return {
      message: 'Invalid email or password',
    };
  }

  const token = await this.jwtService.signAsync({
    sub: user.id,
    email: user.email,
  });


  const { password: _, ...userWithoutPassword } = user;

  return {
    message: 'Sign in successful',
    data: userWithoutPassword,
    token,
  };
}


async signInAdmin(AdminLoginDto: AdminLoginDto) {
  const { email, password } = AdminLoginDto;

  const admin = await this.prisma.admin.findUnique({
    where: {
      email,
    },
  });

  if (!admin) {
    return {
      message: 'Invalid email',
    };
  }

  const passwordMatch = await bcrypt.compare(
    password,
    admin.password,
  );

  if (!passwordMatch) {
    return {
      message: 'Invalid password',
    };
  }

  const token = await this.jwtService.signAsync({
    sub: admin.id,
    email: admin.email,
  });


  const { password: _, ...userWithoutPassword } = admin;

  return {
    message: 'Sign in successful',
    data: userWithoutPassword,
    token,
  };
}


async getProfile(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  const { password, ...userWithoutPassword } = user;

  return {
    message: 'Profile fetched successfully',
    data: userWithoutPassword,
  };
}


async getAllUsers() {
  const users = await this.prisma.user.findMany({
    orderBy: {
      created_at: 'desc',
    },
  });

  const usersWithoutPassword = users.map(({ password, ...user }) => user);

  return {
    message: 'Users fetched successfully',
    data: usersWithoutPassword,
  };
}


async deleteProfile(userId: string){
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  await this.prisma.user.delete({
    where: {
      id: userId,
    },
  });

  return {
    message: 'User profile deleted successfully',
  };
}


async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  const updatedUser = await this.prisma.user.update({
    where: {
      id: userId,
    },
    data: updateUserDto,
  });

  const { password, ...userWithoutPassword } = updatedUser;

  return {
    message: 'Profile updated successfully',
    data: userWithoutPassword,
  };
}

async deactivateAccount(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  const updatedUser = await this.prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      is_active: !user.is_active,
    },
  });

  const { password, ...userWithoutPassword } = updatedUser;

  return {
    message: updatedUser.is_active
      ? 'Account activated successfully'
      : 'Account deactivated successfully',
    data: userWithoutPassword,
  };
}


async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
  const user = await this.prisma.user.findUnique({
    where: {
      email: forgotPasswordDto.email,
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  await this.sendOtp(user.email);

  return {
    message: 'OTP sent successfully to your registered email',
  };
}


async verifyForgotPasswordOtp(
  verifyForgotPasswordOtpDto: VerifyForgotPasswordOtpDto,
) {
  const { email, otp } = verifyForgotPasswordOtpDto;

  const user = await this.prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  const storedOtp = await this.redisService.getOtp(email);

  if (!storedOtp) {
    throw new BadRequestException('OTP expired or not found');
  }

  if (storedOtp !== otp) {
    throw new BadRequestException('Invalid OTP');
  }
  await this.redisService.deleteOtp(email);

  return {
    message: 'OTP verified successfully',
  };
}


async resetPassword(resetPasswordDto: ResetPasswordDto) {
  const {
    email,
    new_password,
    confirm_password,
  } = resetPasswordDto;

  if (new_password !== confirm_password) {
    throw new BadRequestException('Passwords do not match');
  }

  const user = await this.prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);

  await this.prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'Password reset successfully',
  };
}


async changePassword(
  userId: string,
  changePasswordDto: ChangePasswordDto,
) {
  const {
    old_password,
    new_password,
    confirm_password,
  } = changePasswordDto;

  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  const isPasswordValid = await bcrypt.compare(
    old_password,
    user.password,
  );

  if (!isPasswordValid) {
    throw new BadRequestException('Old password is incorrect');
  }

  if (new_password !== confirm_password) {
    throw new BadRequestException('Passwords do not match');
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);

  await this.prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'Password changed successfully',
  };
}


async resendOtp(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  await this.sendOtp(user.email);

  return {
    message: 'OTP resent successfully to your registered email',
  };
}

async sendSMS(userId: string, phoneNumber: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await this.twilioClient.messages.create({
    body: `Your verification OTP is ${otp}. It is valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });

  return {
    message: 'OTP sent successfully to your phone number',
  };
}

}
