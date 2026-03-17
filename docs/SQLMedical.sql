-- SQL script to create tables for a medical database

-- Gender Table
CREATE TABLE TBL_Gender (
    Gender_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Gender VARCHAR(50) NOT NULL,
    In_Use BOOLEAN DEFAULT TRUE
);

-- Country Table
CREATE TABLE TBL_Country (
    Country_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Country VARCHAR(100) NOT NULL UNIQUE,
    In_Use BOOLEAN DEFAULT TRUE
);

-- Town Table
CREATE TABLE TBL_Town (
    Town_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Town VARCHAR(100) NOT NULL,
    In_Use BOOLEAN DEFAULT TRUE,
    Country_Rec_Ref INT NOT NULL,
    FOREIGN KEY (Country_Rec_Ref) REFERENCES TBL_Country(Country_Rec_Ref)
);

-- Status Table
CREATE TABLE TBL_Status (
    Status_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Role VARCHAR(50) NOT NULL UNIQUE,
    In_Use BOOLEAN DEFAULT TRUE
);

-- User Table
CREATE TABLE TBL_User (
    User_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    Status_Rec_Ref INT NOT NULL,
    FOREIGN KEY (Status_Rec_Ref) REFERENCES TBL_Status(Status_Rec_Ref)
);

-- Patient/Doctor Table
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
    Town_Rec_Ref INT NOT NULL,
    Country_Rec_Ref INT NOT NULL,
    Gender_Rec_Ref INT NOT NULL,

    FOREIGN KEY (User_ID) REFERENCES TBL_User(User_Rec_Ref),
    FOREIGN KEY (Town_Rec_Ref) REFERENCES TBL_Town(Town_Rec_Ref),
    FOREIGN KEY (Country_Rec_Ref) REFERENCES TBL_Country(Country_Rec_Ref),
    FOREIGN KEY (Gender_Rec_Ref) REFERENCES TBL_Gender(Gender_Rec_Ref)
);

-- Doctor-Patient Relationship Table
CREATE TABLE TBL_Dr_Pat (
    Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Date DATE NOT NULL,
    Dr_Rec_Ref INT NOT NULL,
    Pat_Rec_Ref INT NOT NULL,

    FOREIGN KEY (Dr_Rec_Ref) REFERENCES TBL_Pat_Dr(Rec_Ref),
    FOREIGN KEY (Pat_Rec_Ref) REFERENCES TBL_Pat_Dr(Rec_Ref)
);

-- Medication Table
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

-- Taken Medication Table
CREATE TABLE TBL_Taken (
    Taken_Rec_Ref INT PRIMARY KEY AUTO_INCREMENT,
    Date_Time DATETIME NOT NULL,
    Meds_Rec_Ref INT NOT NULL,

    FOREIGN KEY (Meds_Rec_Ref) REFERENCES TBL_Meds(Meds_Rec_Ref)
);
