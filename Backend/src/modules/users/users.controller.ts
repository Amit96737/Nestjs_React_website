import { Body, Controller, Post, Get, UseGuards, Delete,Patch, Put } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { VerifyForgotPasswordOtpDto } from './dto/verify-forgot-password-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { SendSmsDto } from './dto/send-sms.dto.js';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sign-up')
  @ApiOperation({ summary: 'Create User' })
  @ApiTags('Authentication')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }


  @Post('admin/sign-up')
  @ApiOperation({ summary: 'Create Admin' })
  @ApiTags('Admin')
  createAdmin(@Body() CreateAdminDto: CreateAdminDto) {
    return this.usersService.createAdmin(CreateAdminDto);
  }


  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify-OTP' })
  @ApiTags('Authentication')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.usersService.verifyOtp(verifyOtpDto);
  }


  @Post('sign-in')
  @ApiOperation({ summary: 'Sign-In' })
  @ApiTags('Authentication')
  signIn(@Body() loginDto: LoginDto) {
    return this.usersService.signIn(loginDto);
  }


  @Post('admin/sign-in')
  @ApiOperation({ summary: 'Sign-In Admin' })
  @ApiTags('Admin')
  signInAdmin(@Body() AdminLoginDto: AdminLoginDto) {
    return this.usersService.signInAdmin(AdminLoginDto);
  }


  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiTags('Authentication')
  @UseGuards(AuthGuard)
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.sub);
  }


  @Get('all-users')
  @ApiOperation({ summary: 'All users list' })
  @ApiTags('Admin')
  @UseGuards(AuthGuard)
  getAllUsers() {
    return this.usersService.getAllUsers();
  }


  @Delete('delete-profile')
  @UseGuards(AuthGuard)
  @ApiTags('Authentication')
  @ApiOperation({ summary: 'Delete User Profile' })
  deleteProfile(@CurrentUser() user: any) {
    return this.usersService.deleteProfile(user.sub);
  }


  @Patch('update-profile')
  @UseGuards(AuthGuard)

  @ApiOperation({ summary: 'Update User Profile' })
  @ApiTags('Authentication')
  updateProfile(
  @CurrentUser() user: any,
  @Body() updateUserDto: UpdateUserDto,) {
  return this.usersService.updateProfile(user.sub, updateUserDto);
  }


  @Patch('deactivate-account')
  @ApiOperation({ summary: 'Activate / Deactivate Account' })
  @ApiTags('Admin')
  @UseGuards(AuthGuard)
  deactivateAccount(@CurrentUser() user: any) {
    return this.usersService.deactivateAccount(user.sub);
  }


  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot Password' })
  @ApiTags('Authentication')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto);
  }


  @Post('verify-forgot-password-otp')
  @ApiOperation({ summary: 'Verify Forgot Password OTP' })
  @ApiTags('Authentication')
  verifyForgotPasswordOtp(
    @Body() verifyForgotPasswordOtpDto: VerifyForgotPasswordOtpDto,
  ) {
    return this.usersService.verifyForgotPasswordOtp(
      verifyForgotPasswordOtpDto,
    );
  }


  @Patch('reset-password')
  @ApiOperation({ summary: 'Reset Password' })
  @ApiTags('Authentication')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(resetPasswordDto);
  }

  
  @Patch('change-password')
  @ApiOperation({ summary: 'Change Password' })
  @ApiTags('Authentication')
  @UseGuards(AuthGuard)
  changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      user.sub,
      changePasswordDto,
    );
  }


  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiTags('Authentication')
  @UseGuards(AuthGuard)
  resendOtp(@CurrentUser() user: any) {
    return this.usersService.resendOtp(user.sub);
  }


@Post('send-sms')
@ApiOperation({ summary: 'Send SMS OTP' })
@ApiTags('Authentication')
@UseGuards(AuthGuard)
sendSMS(
  @CurrentUser() user: any,
  @Body() sendSmsDto: SendSmsDto,
) {
  return this.usersService.sendSMS(
    user.sub,
    sendSmsDto.phone_number,
  );
}

}