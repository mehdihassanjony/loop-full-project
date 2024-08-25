import * as jwt from 'jsonwebtoken';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UserTokenPayloadDto } from '../../../common/common-dto';
import { UserLoginDto } from '../dtos/user.dto';
import { RedisCacheService } from '../../../modules/redis/redis.service';
import { Environment, TeamEnum } from '../../../common/enums';
import { UserRole } from '../../../common/constants';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UserMeDto } from '../dtos/user-me.dto';
import { lastValueFrom } from 'rxjs';
import { SecretOtpDto } from '../dtos/secret-otp.dto';
import { CommandBus } from '@nestjs/cqrs';
import { AnnounceUserLastActivityCommand } from 'src/modules/broker/commands/announce-user-last-activity.command';
import { AnnounceUserLoginCommand } from 'src/modules/broker/commands/announce-user-login.command';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserCacheService } from '../../redis/user.cache.service';
import { User } from '@sentry/node';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private connection: DataSource,
    private readonly redisCacheService: RedisCacheService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
    private userCache: UserCacheService,
  ) {}

  async validateToken(request: any): Promise<UserTokenPayloadDto> {
    if (!request.headers.authorization) {
      throw new BadRequestException('No authorization provided');
    }

    const token: string = request.headers['authorization'].replace(
      'Bearer ',
      '',
    );

    try {
      var decoded: UserTokenPayloadDto = jwt.verify(
        token,
        this.configService.get('jwtSecret'),
      ) as UserTokenPayloadDto;

      request['user'] = decoded;

      return decoded;
    } catch (error: any) {
      // Unauthorized for invalid credentials
      throw new UnauthorizedException('Unauthorized');
    }
  }

  async validateUserToken(request: Request): Promise<UserTokenPayloadDto> {
    const ht = request.headers['authorization'];
    if (!ht) throw new BadRequestException('No authorization provided');
    const token: string = ht.replace('Bearer ', '');
    try {
      const decoded: UserTokenPayloadDto = jwt.verify(
        token,
        this.configService.get('jwtSecret'),
      ) as UserTokenPayloadDto;

      // === IT WILL THROW DISABLES USERS TO LOGIN PAGE AGAIN === //
      if (!decoded.isEnabled) {
        throw new UnauthorizedException(
          'Forbidden! Your account has been temporarily disbled',
        );
      }

      // ========= FOR VENDOR SINGLE APP DEVICE ========= //

      // if (decoded.role === UserRole.VENDOR) {
      //   const vendorDevice = await this.redisCacheService.get(
      //     `user_${decoded.userId.toString()}_device`,
      //   );

      //   if (!vendorDevice || vendorDevice !== token) {
      //     throw new UnauthorizedException('Forbidden! Device not registered');
      //   }
      // }

      delete decoded['iat'];
      delete decoded['exp'];

      // set user activity
      this.setupUserActivity(decoded.userId);
      Logger.log(JSON.stringify(decoded, null, 3), 'TokenValidate');
      return decoded;
    } catch (err) {
      throw new UnauthorizedException(err.message);
    }
  }

  private async setupUserActivity(userId: string): Promise<boolean> {
    const hasUserCache = await this.userCache.getUserActivity(userId);
    console.log('hasUserCache', hasUserCache);

    if (!hasUserCache) {
      await this.commandBus.execute(
        new AnnounceUserLastActivityCommand({
          userId: userId,
        }),
      );
      this.userCache.setUserActivity(userId);
    }
    return true;
  }

  // public async refreshUserToken() {
  //   let tokenPayload: UserTokenPayloadDto =
  //     await this.authService.validateToken({
  //       headers: { authorization: body.refreshToken },
  //     });

  //   // ============= CHECK TOKEN EXIST IN REDIS ============ //
  //   let redisExist = await this.redisCacheService.get(body.refreshToken);

  //   if (!redisExist) {
  //     throw new UnauthorizedException('Session expired! please login again');
  //   }

  //   let user: User = await this.userRepository.findOne({
  //     where: { userId: tokenPayload.userId },
  //   });

  //   let payload: UserTokenPayloadDto = await this.generateUserTokenPayload(
  //     user,
  //   );

  //   // ============ CREATE LOG OF REFRESH TOKEN ============== //
  //   this.userLogService.createLog(user, 'refreshToken');

  //   // =========== DELETE REFRESH TOKEN FROM REDIS ============ //
  //   this.redisCacheService.del(body.refreshToken);

  //   let response = await this.getAccessRefrestoken(payload);

  //   return response;
  // }

  // ================ NOT CURRENTLY USING ================== //
  async login(request, body: UserLoginDto) {
    let [userExists] = await this.connection.query(
      `
			select 
				* 
			from 
				"user" 
			where 
				(email=$1 or phone=$2)
	  	`,
      [body.phoneOrEmail, body.phoneOrEmail],
    );

    // ===================== PHONE OR EMAIL NOT FOUND =================== //
    if (!userExists) {
      throw new BadRequestException(
        `User with that ${
          body.phoneOrEmail.includes('@') ? 'email' : 'phone'
        } not found`,
      );
    }

    // ===================== ACCOUNT IS DISABLED ======================= //
    if (!userExists.isEnabled) {
      throw new ForbiddenException(
        'Your account has been temporarily disabled',
      );
    }

    // ========== ALLOWED USER ROLES FOR DIFFERENT PLATFORM =========== //
    if (
      body.allowedUserRoles &&
      !body.allowedUserRoles.includes(userExists.role)
    ) {
      throw new BadRequestException(
        this.detectDevice(request) === 'web'
          ? 'Shipper or Vendor must log in with mobile app'
          : 'You are trying to access using a wrong account.',
      );
    }

    // =================== PASSWORD DIDN'T MATCH ===================== //
    let matched = await this.checkPasswordMatch(
      userExists.password,
      body.password,
    );

    if (!matched) {
      throw new BadRequestException("Credentials didn't match!");
    }

    // not phone verified=>resend otp=>400 with data otpSent:true
    // if (!userExists.phoneVerified) {
    //   // need to send otp

    //   // await this.otpService.createOtp(
    //   //   userExists,
    //   //   body.phoneOrEmail,
    //   //   PHONE_VERIFY_TEXT,
    //   // );
    //   //  throw new ForbiddenException('Please verify phone first!');

    //   return {
    //     message: `Please verify phone first`,
    //     data: {
    //       isOtpSent: true,
    //       phone: userExists.phone,
    //       email: userExists.email,
    //     },
    //   };
    // }

    // ======================= OTP SENDER ======================== //
    if (!userExists.phoneVerified) {
      let activeExist = await this.connection.query(
        `
				select 
					*
				from 
					otp
				where 
					"userId"=$1 
				and
					"validTill">$2		
				`,
        [userExists.id, new Date()],
      );

      if (activeExist && activeExist.length !== 0) {
        activeExist = activeExist[0];
        return {
          data: {
            otpScreen: true,
            isOtpSent: false,
            validTill: activeExist.validTill,
            phone: userExists.phone,
            email: userExists.email,
          },
          message: 'You have a active OTP session! Please wait some time.',
        };
      }

      let [{ count: oneHourRestrictCount }] = await this.connection.query(
        `
				select 
					count(*)
				from 
					otp
				where 
					"userId"=$1 
				and
					"validTill">$2
				`,
        [userExists.id, this.getMinutesBeforeIso(60)],
      );

      if (oneHourRestrictCount !== '0') {
        throw new BadRequestException(
          'Too Many Request! Please try again after some time',
        );
      }

      // ============= CALL USER SERVICE SECRET API CALL ============= //
      let otpData: SecretOtpDto = await this.createSecretOtp(userExists.userId);

      return {
        message: `Please verify phone first`,
        data: {
          otpScreen: true,
          isOtpSent: true,
          validTill: otpData ? otpData.validTill : null, // SET TO API CALL DATA
          phone: userExists.phone,
          email: userExists.email,
        },
      };
    }

    // ===================== OTP SENDER END ======================= //

    let payload: UserTokenPayloadDto = await this.generateUserTokenPayload(
      userExists,
    );

    let data = await this.getAccessRefrestoken(payload);

    // ================== LAST LOGIN AND LOG SAVE ================== //

    this.commandBus.execute(
      new AnnounceUserLoginCommand({
        userId: userExists.userId,
      }),
    );

    // ================ LAST LOGIN AND LOG SAVE END ================ //

    return { message: 'Successfully logged in', data };
  }

  async me(userId: string): Promise<any> {
    let [user]: [UserMeDto] = await this.connection.query(
      `
			select 
			  id,
				"userId", 
				"fullName", 
				email, 
				phone, 
				role, 
				gender, 
				"profilePicture", 
				"createdAt", 
				"isEnabled", 
				"isVerified", 
				"phoneVerified", 
				"emailVerified", 
				dob, 
				nid, 
				tin 
			from 
				"user" 
			where 
				"userId" = $1
	    ;`,
      [userId],
    );

    if (!user) {
      throw new NotFoundException('User with that userId not found');
    }

    if (!user.isEnabled) {
      throw new ForbiddenException(
        'Your account has been temporarily disabled',
      );
    }

    // ============ NEED TO ADD SHIPPER COMPANY ID =========== //

    // ========= SET COMPANY ID NULL FOR OTHER USERS ========= //

    // user['companyId'] = null;

    // ============= CALL FOR SHIPPER ONLY ============= //

    // if (user.role === UserRole.SHIPPER) {
    //   const data = await this.getShipperCompany(user.userId);
    //   user['companyId'] = data?.companyId;
    // }

    // =========== NEED TO ADD TEAM FOR KAM AND PRO ============ //

    // ============ SET TEAM NULL FOR OTHER USERS ============== //
    user['team'] = null;

    // =========== SET TEAM FOR PRO AND KAM ONLY =============== //
    if (user.role === UserRole.KAM) {
      const data = await this.connection.query(
        `
				select 
				  "team"
				from 
				  "hierarchy" 
				where 
				  "childId"=$1
				limit 1
					;
				`,
        [user.id],
      );
      user['team'] = data?.team;
    }

    if (user.role === UserRole.PRO) {
      user['team'] = TeamEnum.BUSINESS_ACCELERATION;
    }

    await this.commandBus.execute(
      new AnnounceUserLastActivityCommand({
        userId: user.userId,
      }),
    );

    return user;
  }

  private async getShipperCompany(userId: string) {
    let url = `${this.configService.get(
      'companyService',
    )}/secret/company/user/${userId}`;

    let headers = {
      'secret-key': process.env.SECRET_KEY,
    };

    try {
      let res = await lastValueFrom(this.httpService.get(url, { headers }));

      if (!res.data || !res.data.success) {
        throw new BadRequestException(res.data.message);
      }

      return res.data.data;
    } catch (exception: any) {
      Logger.error(`Error: ${exception}`, 'getShipperCompany function');
      return null;
    }
  }

  private async createSecretOtp(userId: string): Promise<SecretOtpDto> {
    let url = `${this.configService.get('userService')}/secret/otp/`;
    try {
      let res = await lastValueFrom(
        await this.httpService.post(
          url,
          {
            userId,
          },
          {
            headers: {
              'secret-key': this.configService.get('secretConfig').secret,
            },
          },
        ),
      );

      return res.data.data as SecretOtpDto;
    } catch (error) {
      new BadRequestException('Something went wrong! Try again later');
    }
  }

  private detectDevice(request): string {
    const toMatchAndroid = [
      /Android/i,
      /webOS/i,
      /BlackBerry/i,
      /Windows Phone/i,
      /okhttp/i,
    ];

    const toMatchIos = [/iPhone/i, /iPad/i, /iPod/i];

    const isAndroid = toMatchAndroid.some((item) =>
      request.headers['user-agent'].match(item),
    );

    if (isAndroid) return 'android';

    const isIos = toMatchIos.some((item) =>
      request.headers['user-agent'].match(item),
    );

    if (isIos) return 'ios';

    // else return web
    return 'web';
  }

  private async checkPasswordMatch(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  private async generateUserTokenPayload(
    data: User,
  ): Promise<UserTokenPayloadDto> {
    let payload = {
      id: parseInt(data.id),
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      phoneVerified: data.phoneVerified,
      emailVerified: data.emailVerified,
      isEnabled: data.isEnabled,
      isVerified: data.isVerified,
      isPasswordSet: data.isPasswordSet,
      role: data.role,
      profilePicture: data.profilePicture,
      lastLogin: data.lastLogin ? data.lastLogin : new Date(), // for the first login we convert null to a date
      gender: data.gender, // ADDED LATER FOR BOOKING SERVICE
      createdAt: data.createdAt, // ADDED LATER FOR BOOKING SERVICE
    };

    if (payload.role === UserRole.KAM) {
      const data = await this.connection.query(
        `
				select 
					team
				from
					hierarchy
				where
					"childId" = $1
				limit 1
				;
				`,
        [payload.id],
      );

      payload['team'] = data?.team;
    }
    return payload;
  }

  async getAccessRefrestoken(payload: UserTokenPayloadDto) {
    let isPasswordSet = payload.isPasswordSet;

    delete payload.isPasswordSet;

    let responseBody = {
      accessToken: await this.generateToken(
        payload,
        process.env.NODE_ENV === Environment.PRODUCTION
          ? 60 * 20 * 24 * 365 // in production lifeCycle 20 minutes 60 * 20
          : 60 * 60 * 24 * 365, // in other enviroments lifeCycle 365 days
      ),
      refreshToken: await this.generateToken(
        payload,
        process.env.NODE_ENV === Environment.PRODUCTION
          ? 60 * 60 * 24 * 366 // in production lifeCycle 10 days 60 * 60 * 24 * 10
          : 60 * 60 * 24 * 366, // in other enviroments lifeCycle (365+1)=366 days..1 day extra added for not be identical to accessToken
      ),
      isPasswordSet, // isPasswordSet true will trigger the gui to switch to change password screen
    };

    return responseBody;
  }

  private async generateToken(payload, time): Promise<string> {
    let token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: time,
      algorithm: 'HS256',
    });

    this.redisCacheService.set(token, payload.id, time);

    return token;
  }

  private getMinutesBeforeIso(minutesToMinus: number) {
    let currentDate = new Date();
    let beforeDate = new Date(currentDate.getTime() - minutesToMinus * 60000);
    return beforeDate;
  }
}
