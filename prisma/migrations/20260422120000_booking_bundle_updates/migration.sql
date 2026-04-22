-- AlterTable
ALTER TABLE `Spa`
    ADD COLUMN `requiresBookingConsent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `bookingConsentText` TEXT NULL;

-- AlterTable
ALTER TABLE `Booking`
    ADD COLUMN `customerName` VARCHAR(191) NULL,
    ADD COLUMN `customerEmail` VARCHAR(191) NULL,
    ADD COLUMN `customerPhone` VARCHAR(191) NULL,
    ADD COLUMN `consentAcceptedAt` DATETIME(3) NULL,
    ADD COLUMN `consentSignature` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `BookingItem` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `subserviceId` VARCHAR(191) NOT NULL,
    `orderIndex` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BookingItem_bookingId_orderIndex_idx`(`bookingId`, `orderIndex`),
    INDEX `BookingItem_subserviceId_idx`(`subserviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BookingItem`
    ADD CONSTRAINT `BookingItem_bookingId_fkey`
    FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingItem`
    ADD CONSTRAINT `BookingItem_subserviceId_fkey`
    FOREIGN KEY (`subserviceId`) REFERENCES `Subservice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
