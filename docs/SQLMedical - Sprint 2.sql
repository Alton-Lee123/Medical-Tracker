-- DROP TABLES (optional - for re-run)
DROP TABLE IF EXISTS TBL_Pat_Allergy;
DROP TABLE IF EXISTS TBL_Allergy;
DROP TABLE IF EXISTS TBL_Taken;
DROP TABLE IF EXISTS TBL_Medication;
DROP TABLE IF EXISTS TBL_Meds;
DROP TABLE IF EXISTS TBL_Dr_Pat;
DROP TABLE IF EXISTS TBL_Pat_Dr;
DROP TABLE IF EXISTS TBL_User;
DROP TABLE IF EXISTS TBL_Status;
DROP TABLE IF EXISTS TBL_Town;
DROP TABLE IF EXISTS TBL_Country;
DROP TABLE IF EXISTS TBL_Gender;

-- CORE TABLES

CREATE TABLE TBL_Gender (
    Gender_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Gender VARCHAR(50) NOT NULL,
    In_Use BOOLEAN DEFAULT TRUE
);

CREATE TABLE TBL_Country (
    Country_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Country VARCHAR(100) NOT NULL UNIQUE,
    In_Use BOOLEAN DEFAULT TRUE
);

CREATE TABLE TBL_Town (
    Town_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Town VARCHAR(100) NOT NULL,
    In_Use BOOLEAN DEFAULT TRUE,
    Country_Rec_Ref INT NOT NULL,
    FOREIGN KEY (Country_Rec_Ref) REFERENCES TBL_Country(Country_Rec_Ref)
);

CREATE TABLE TBL_Status (
    Status_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Role VARCHAR(50) NOT NULL UNIQUE,
    In_Use BOOLEAN DEFAULT TRUE
);

-- USER TABLE

CREATE TABLE TBL_User (
    User_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    Status_Rec_Ref INT NOT NULL,
    FOREIGN KEY (Status_Rec_Ref) REFERENCES TBL_Status(Status_Rec_Ref)
);

-- PATIENT / DOCTOR TABLE (MAIN TABLE)

CREATE TABLE TBL_Pat_Dr (
    Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    User_ID INT NOT NULL UNIQUE,

    Name VARCHAR(100) NOT NULL,
    Surname VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Mobile VARCHAR(20),
    DOB DATE,

    Add_1 VARCHAR(255),
    Add_2 VARCHAR(255),
    Add_3 VARCHAR(255),

    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- NEW FIELDS
    Height_M DECIMAL(5,2) NOT NULL,
    Weight_KG DECIMAL(5,2) NOT NULL,

    -- BMI AUTO CALCULATED
    BMI DECIMAL(5,2)
    GENERATED ALWAYS AS (Weight_KG / (Height_M * Height_M)) STORED,

    Town_Rec_Ref INT NOT NULL,
    Country_Rec_Ref INT NOT NULL,
    Gender_Rec_Ref INT NOT NULL,

    FOREIGN KEY (User_ID) REFERENCES TBL_User(User_Rec_Ref),
    FOREIGN KEY (Town_Rec_Ref) REFERENCES TBL_Town(Town_Rec_Ref),
    FOREIGN KEY (Country_Rec_Ref) REFERENCES TBL_Country(Country_Rec_Ref),
    FOREIGN KEY (Gender_Rec_Ref) REFERENCES TBL_Gender(Gender_Rec_Ref)
);

-- DOCTOR-PATIENT RELATIONSHIP

CREATE TABLE TBL_Dr_Pat (
    Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Date DATE NOT NULL,
    Dr_Rec_Ref INT NOT NULL,
    Pat_Rec_Ref INT NOT NULL,

    FOREIGN KEY (Dr_Rec_Ref) REFERENCES TBL_Pat_Dr(Rec_Ref),
    FOREIGN KEY (Pat_Rec_Ref) REFERENCES TBL_Pat_Dr(Rec_Ref),

    -- جلوگیری از تکرار رابطه
    UNIQUE (Dr_Rec_Ref, Pat_Rec_Ref)
);

-- MEDICATION SYSTEM

CREATE TABLE TBL_Meds (
    Meds_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Medication VARCHAR(255) NOT NULL UNIQUE,
    Dose VARCHAR(100) NOT NULL,
    Frequency VARCHAR(100) NOT NULL
);

CREATE TABLE TBL_Medication (
    Medication_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Medication_Date DATE NOT NULL,

    Meds_Rec_Ref INT NOT NULL,
    Pat_Rec_Ref INT NOT NULL,
    Dr_Rec_Ref INT NOT NULL,

    FOREIGN KEY (Meds_Rec_Ref) REFERENCES TBL_Meds(Meds_Rec_Ref),
    FOREIGN KEY (Pat_Rec_Ref) REFERENCES TBL_Pat_Dr(Rec_Ref),
    FOREIGN KEY (Dr_Rec_Ref) REFERENCES TBL_Pat_Dr(Rec_Ref)
);

-- MEDICATION TAKEN TRACKING

CREATE TABLE TBL_Taken (
    Taken_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Date_Time DATETIME NOT NULL,
    Meds_Rec_Ref INT NOT NULL,

    FOREIGN KEY (Meds_Rec_Ref) REFERENCES TBL_Meds(Meds_Rec_Ref)
);

-- ALLERGY SYSTEM

CREATE TABLE TBL_Allergy (
    Allergy_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Allergy_Name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE TBL_Pat_Allergy (
    Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Pat_Rec_Ref INT NOT NULL,
    Allergy_Rec_Ref INT NOT NULL,

    FOREIGN KEY (Pat_Rec_Ref) REFERENCES TBL_Pat_Dr(Rec_Ref),
    FOREIGN KEY (Allergy_Rec_Ref) REFERENCES TBL_Allergy(Allergy_Rec_Ref),

    -- جلوگیری از ثبت تکراری آلرژی
    UNIQUE (Pat_Rec_Ref, Allergy_Rec_Ref)
);

-- LIFESPAN FUNCTION

DELIMITER $$

CREATE FUNCTION FN_Estimated_Lifespan(p_DOB DATE, p_BMI DECIMAL(5,2))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_Age INT;
    DECLARE v_LifeExpectancy INT DEFAULT 80;

    SET v_Age = TIMESTAMPDIFF(YEAR, p_DOB, CURDATE());

    IF p_BMI < 18.5 THEN
        SET v_LifeExpectancy = v_LifeExpectancy - 5;
    ELSEIF p_BMI BETWEEN 18.5 AND 24.9 THEN
        SET v_LifeExpectancy = v_LifeExpectancy + 2;
    ELSEIF p_BMI BETWEEN 25 AND 29.9 THEN
        SET v_LifeExpectancy = v_LifeExpectancy - 2;
    ELSEIF p_BMI >= 30 THEN
        SET v_LifeExpectancy = v_LifeExpectancy - 8;
    END IF;

    RETURN v_LifeExpectancy - v_Age;
END$$

DELIMITER ;

-- TEST QUERY

-- SELECT 
--     Name,
--     Surname,
--     DOB,
--     BMI,
--     FN_Estimated_Lifespan(DOB, BMI) AS Estimated_Years_Left
-- FROM TBL_Pat_Dr;