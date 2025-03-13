const { MigrationInterface, QueryRunner } = require("typeorm")

module.exports = class AddStatusToCourseBooking {
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE COURSE_BOOKING 
            ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE COURSE_BOOKING 
            DROP COLUMN status
        `);
    }
} 