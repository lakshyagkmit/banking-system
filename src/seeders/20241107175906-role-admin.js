'use strict';
const bcrypt = require('bcryptjs');

// Insert roles and admin user seeder in the database
module.exports = {
  async up(queryInterface, Sequelize) {
    const [adminRole, branchManagerRole, customerRole] = await queryInterface.bulkInsert(
      'roles',
      [{ name: 'Admin' }, { name: 'Branch Manager' }, { name: 'Customer' }],
      { returning: ['id'] }
    );

    const [adminUser] = await queryInterface.bulkInsert(
      'users',
      [
        {
          name: 'Lakshya Kr. Singh',
          email: 'lakshyakumarsingh2621@gmail.com',
          password: bcrypt.hashSync('lakshya7890*#', 10),
          contact: '6290698356',
          father_name: 'Randhir Kr. Singh',
          mother_name: 'Ragini Singh',
          address: 'Kolkata, India',
          is_verified: true,
        },
      ],
      { returning: ['id'] }
    );

    await queryInterface.bulkInsert(
      'users_roles',
      [
        {
          user_id: adminUser.id,
          role_id: adminRole.id,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {},
};
