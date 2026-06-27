import { connectDatabase, disconnectDatabase } from '../config/database';
import { User, UserRole, UserStatus } from '../models/User';
import { hashPassword } from '../utils/password';
import { generateReferralCode } from '../utils/otp';

const run = async () => {
  // Parse command line arguments if any
  // Format: npx ts-node src/scripts/createAdmin.ts <mobile> <password> <name>
  const args = process.argv.slice(2);
  const mobile = args[0] || '9876543210';
  const password = args[1] || 'adminpassword123';
  const name = args[2] || 'System Administrator';

  console.log('--- Gyaan Chakra Admin Generator ---');
  console.log(`Target Name:     ${name}`);
  console.log(`Target Mobile:   ${mobile}`);
  console.log(`Target Password: ${password}`);
  console.log('------------------------------------');

  try {
    // Connect to Database
    await connectDatabase();

    // Check if user already exists
    let user = await User.findOne({ mobile });

    if (user) {
      console.log(`User with mobile ${mobile} already exists.`);
      console.log(`Updating role to SUPER_ADMIN and resetting password...`);
      
      const hashedPassword = await hashPassword(password);
      user.role = UserRole.SUPER_ADMIN;
      user.status = UserStatus.ACTIVE;
      user.password = hashedPassword;
      // We must disable the find pre-hook query filter to allow finding/updating deleted users if any
      user.deletedAt = undefined as any; 
      
      await user.save();
      console.log(`🚀 Success: User promoted to SUPER_ADMIN!`);
    } else {
      console.log(`Creating new user...`);
      const hashedPassword = await hashPassword(password);
      const referralCode = generateReferralCode();

      user = await User.create({
        name,
        mobile,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        referralCode,
        isMobileVerified: true,
        isEmailVerified: true,
      });

      console.log(`🚀 Success: Admin created with ID: ${user._id}`);
    }

    console.log('\nUse these credentials to log in:');
    console.log(`Mobile:   ${mobile}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('❌ Error executing script:', error);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

run();
