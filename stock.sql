-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 06, 2026 at 03:19 PM
-- Server version: 10.11.18-MariaDB
-- PHP Version: 8.4.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cguwtces_stock`
--

-- --------------------------------------------------------

--
-- Table structure for table `boq`
--

CREATE TABLE `boq` (
  `boq_id` int(11) NOT NULL,
  `boq_number` varchar(100) NOT NULL,
  `order_id` int(11) NOT NULL,
  `order_number` varchar(100) NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `client_name` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `boq_items`
--

CREATE TABLE `boq_items` (
  `item_id` int(11) NOT NULL,
  `boq_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `unit` varchar(40) DEFAULT NULL,
  `quantity` decimal(12,3) NOT NULL DEFAULT 0.000
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `brand`
--

CREATE TABLE `brand` (
  `brand_id` int(11) NOT NULL,
  `brand_name` varchar(255) NOT NULL,
  `brand_active` int(11) NOT NULL,
  `brand_status` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `brand`
--

INSERT INTO `brand` (`brand_id`, `brand_name`, `brand_active`, `brand_status`) VALUES
(1, 'Total', 2, 2),
(11, 'Total', 1, 2),
(12, 'Total', 1, 2),
(13, 'Penanel Vinyl 50m (1600mm)', 1, 2),
(14, 'GlueDevil', 1, 2),
(15, 'Econo-Print', 1, 2),
(16, 'Penanel', 1, 2),
(17, 'Helmet', 1, 2),
(18, 'Safety Helmet ', 1, 2),
(19, 'Safety Helmet ', 1, 2),
(20, 'Safety Helmet ', 1, 2),
(21, 'Safety Helmet ', 1, 2),
(22, 'Safety Helmet ', 1, 1),
(23, 'Total/ Emtop', 1, 1),
(24, 'Emtop', 1, 1),
(25, 'Total/Topline/Aiyi', 1, 2),
(26, 'Total/Topline/Aiyi', 1, 1),
(27, 'Total ', 1, 1),
(28, 'Showcase It Brands', 1, 1),
(29, 'Penanel', 1, 1),
(30, 'Worksite', 1, 1),
(31, 'Penanel ', 1, 2),
(32, 'Evo Solvent Ink', 1, 1),
(33, 'Evo Solvent Ink', 1, 2),
(34, 'Boards', 1, 2),
(35, 'MDF BOARDS', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `categories_id` int(11) NOT NULL,
  `categories_name` varchar(255) NOT NULL,
  `categories_active` int(11) NOT NULL,
  `categories_status` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`categories_id`, `categories_name`, `categories_active`, `categories_status`) VALUES
(12, 'Penanel', 1, 2),
(13, 'Spray Paint', 1, 2),
(14, 'Vinyl', 2, 2),
(15, 'Fan', 1, 2),
(16, 'Company Tools', 1, 1),
(17, 'Company Tools', 1, 2),
(18, 'Consumables', 1, 1),
(19, 'Boards', 1, 1),
(20, 'Furniture ', 1, 1),
(21, 'Electricals', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `fuel_logs`
--

CREATE TABLE `fuel_logs` (
  `fuel_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `fuel_date` date NOT NULL,
  `odometer_reading` decimal(12,2) NOT NULL,
  `litres` decimal(12,2) NOT NULL,
  `fuel_cost` decimal(12,2) NOT NULL,
  `fuel_station` varchar(255) DEFAULT NULL,
  `receipt_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `issued_tools`
--

CREATE TABLE `issued_tools` (
  `issue_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `date_of_collection` date NOT NULL,
  `collector_name` varchar(100) NOT NULL,
  `tool_name` varchar(250) NOT NULL,
  `quantity_issued` int(11) NOT NULL,
  `job_name` varchar(150) DEFAULT NULL,
  `date_of_return` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `issued_tools`
--

INSERT INTO `issued_tools` (`issue_id`, `product_id`, `date_of_collection`, `collector_name`, `tool_name`, `quantity_issued`, `job_name`, `date_of_return`, `created_at`) VALUES
(8, 26, '2025-12-08', 'Nyasha Losso', 'Perspex blades', 1, 'Work Shop', '2025-12-17', '2025-12-11 15:58:49'),
(9, 59, '2025-12-15', 'Joash', 'Vinyl (Glossy)', 1, 'Spirit Embassy Counters', '2025-12-15', '2025-12-15 11:20:15'),
(10, 59, '2025-12-17', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'Spirit Embassy ', '2025-12-17', '2025-12-17 08:32:31'),
(11, 59, '2025-12-17', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'Spirit Embassy ', '2025-12-17', '2025-12-17 08:32:31'),
(12, 75, '2025-12-18', 'Comfort', 'Gloss vinyl black', 1, 'Mrs Chidavaenzi', '2025-12-18', '2025-12-18 07:46:33'),
(13, 59, '2025-12-23', 'Calvin ', 'Vinyl (Glossy)', 1, 'Spirit Embassy ', '2025-12-23', '2025-12-23 09:55:50'),
(14, 34, '2025-12-23', 'Calvin', 'Utility knife', 1, 'Graphics', '2025-12-26', '2025-12-23 13:06:42'),
(15, 34, '2025-12-23', 'Calvin', 'Utility knife', 1, 'Graphics', '2025-12-26', '2025-12-23 13:06:45'),
(16, 34, '2025-12-23', 'Calvin', 'Utility knife', 1, 'Graphics', '2025-12-26', '2025-12-23 13:06:46'),
(17, 59, '2025-12-24', 'Calvin', 'Vinyl (Glossy)', 1, 'Spirit Embassy ', '2025-12-26', '2025-12-26 10:52:16'),
(18, 59, '2025-12-26', 'Calvin', 'Vinyl (Glossy)', 1, 'Spirit Embassy ', '2025-12-26', '2025-12-26 10:52:44'),
(19, 59, '2025-12-26', 'Nyasha Makamanzi (and blue half)', 'Vinyl (Glossy)', 2, 'Spirit Embassy ', '2025-12-26', '2025-12-26 16:33:02'),
(20, 25, '2025-12-27', 'Mr Mbongeni', 'Flash drive', 1, 'Spirit Embassy ', '2025-12-27', '2025-12-27 14:12:32'),
(21, 59, '2025-12-27', 'Calvin ', 'Vinyl (Glossy)', 1, 'Spirit Embassy ', '2025-12-27', '2025-12-27 14:13:50'),
(22, 59, '2025-12-27', 'Calvin ', 'Vinyl (Glossy)', 1, 'Spirit Embassy ', '2025-12-27', '2025-12-27 14:13:58'),
(23, 59, '2025-12-29', 'Tanaka', 'Vinyl (Glossy)', 1, 'Kelvin Set up and Choir', '2025-12-29', '2025-12-29 15:22:39'),
(24, 59, '2025-12-30', 'Comfort ', 'Vinyl (Glossy)', 2, 'Scarlet', '2025-12-30', '2025-12-30 08:06:02'),
(25, 59, '2025-12-30', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'Scarlet', '2025-12-30', '2025-12-30 08:06:22'),
(26, 59, '2025-12-29', 'Panashe ', 'Vinyl (Glossy)', 1, 'Anot', '2025-12-29', '2026-01-30 10:47:35'),
(27, 59, '2026-01-24', 'Booker ', 'Vinyl (Glossy)', 1, 'UZ', '2026-01-24', '2026-01-30 10:49:24'),
(28, 59, '2025-12-29', 'Booker ', 'Vinyl (Glossy)', 4, 'Celestial Choir HICC', '2025-12-29', '2026-01-30 10:51:34'),
(29, 59, '2026-01-24', 'Rushmore ', 'Vinyl (Glossy)', 1, 'UZ', '2026-01-24', '2026-01-30 10:52:53'),
(30, 59, '2026-01-25', 'Rufaro ', 'Vinyl (Glossy)', 1, 'UZ', '2026-01-25', '2026-01-30 10:53:58'),
(31, 59, '2026-01-26', 'Rushmore ', 'Vinyl (Glossy)', 3, 'UZ Prints', '2026-01-26', '2026-01-30 10:54:55'),
(32, 61, '2026-01-21', 'Kelvin ', 'Vinyl( Matte)', 1, 'Netone', '2026-01-21', '2026-01-30 10:56:14'),
(33, 78, '2026-01-27', 'Tanaka', 'PVC', 1, 'UZ', '2026-01-27', '2026-01-30 11:07:49'),
(34, 83, '2026-02-22', 'Mr Rushmore ', 'Pink Ink', 1, 'ZIFA', '2026-02-22', '2026-02-25 06:45:16'),
(35, 85, '2026-02-22', 'Mr Rushmore ', 'Blue ink', 1, 'ZIFA', '2026-02-22', '2026-02-25 06:45:48'),
(36, 59, '2026-02-25', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'Bureau Veritus', '2026-02-25', '2026-02-25 12:36:37'),
(37, 59, '2026-02-28', 'Rashmore', 'Vinyl (Glossy)', 1, 'Hippodrome ', '2026-02-28', '2026-03-02 04:59:46'),
(38, 59, '2026-02-28', 'Joash', 'Vinyl (Glossy)', 1, 'Hippodrome ', '2026-01-30', '2026-03-02 05:03:11'),
(39, 59, '2026-01-30', 'Joash', 'Vinyl (Glossy)', 1, 'Hippodrome ', '2026-01-30', '2026-03-02 05:05:04'),
(40, 59, '2026-02-21', 'Peter', 'Vinyl (Glossy)', 1, 'Victoria falls', '2026-02-21', '2026-03-02 05:06:39'),
(41, 59, '2026-02-21', 'Mr Rashai', 'Vinyl (Glossy)', 1, 'ZIFA', '2026-02-21', '2026-03-02 05:07:31'),
(42, 59, '2026-03-03', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'ZIFA', '2026-03-03', '2026-03-03 08:03:42'),
(43, 59, '2026-03-03', 'Munashe ', 'Vinyl (Glossy)', 1, 'ZIFA', '2026-03-03', '2026-03-03 12:06:53'),
(44, 59, '2026-03-03', 'Joash ', 'Vinyl (Glossy)', 1, 'White Geese', '2026-03-03', '2026-03-03 14:33:22'),
(45, 59, '2026-03-03', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'ZIFA', '2026-03-03', '2026-03-04 07:14:19'),
(46, 59, '2026-03-06', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'Upway Events', '2026-03-06', '2026-03-06 12:55:06'),
(47, 59, '2026-03-03', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'ZIFA', '2026-03-03', '2026-03-06 12:56:17'),
(48, 59, '2026-03-09', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'Unicef', '2026-03-09', '2026-03-09 13:50:54'),
(49, 59, '2026-03-20', 'Mr Mindy/ Booker', 'Vinyl (Glossy)', 8, 'Floor Chinhoi', '2026-03-20', '2026-03-23 10:58:17'),
(50, 83, '2026-03-25', 'Thabo', 'Pink Ink', 1, 'Intertake ', '2026-03-25', '2026-03-25 07:57:20'),
(51, 85, '2026-03-25', 'Thabo', 'Blue ink', 1, 'Intertake ', '2026-03-25', '2026-03-25 07:57:32'),
(52, 87, '2026-03-25', 'Smith', 'MDF Superwood boards', 7, 'HIT(ZITF) CNC Cutting ', '2026-03-25', '2026-03-25 13:04:41'),
(53, 86, '2026-01-24', 'Tanaka', 'Yellow ink', 1, 'Tanaka', '2026-01-24', '2026-03-25 13:11:09'),
(54, 59, '2026-03-25', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'UZ Cook out', '2026-03-25', '2026-03-25 14:32:08'),
(55, 87, '2026-03-25', 'Smith ', 'MDF Superwood boards', 1, 'HIT(ZITF) Cutting ', '2026-03-25', '2026-03-26 05:24:48'),
(56, 87, '2026-03-26', 'Smith', 'MDF Superwood boards', 1, 'HIT(ZITF) Cutting CNC', '2026-03-26', '2026-03-26 12:42:02'),
(57, 102, '2026-03-26', 'Mr Mindy ', 'Melamine boards', 2, 'ZITF (Telone)to be cut', '2026-03-26', '2026-03-26 13:28:40'),
(58, 87, '2026-03-26', 'Mr Mindy', 'MDF Superwood boards', 2, 'ZITF(Telone) Pavillion ', '2026-03-26', '2026-03-27 10:54:54'),
(59, 87, '2026-03-26', 'Mr Mindy', 'MDF Superwood boards', 2, 'ZITF(Telone) Pavillion ', '2026-03-26', '2026-03-27 10:54:55'),
(60, 87, '2026-03-27', 'Mr Mindy', 'MDF Superwood boards', 3, 'ZITF(Telone) Pavillion ', '2026-03-27', '2026-03-27 10:55:21'),
(61, 87, '2026-03-28', 'Mr Brian', 'MDF Superwood boards', 3, 'ZITF (Telone)to be cut', '2026-03-28', '2026-03-31 14:32:38'),
(62, 102, '2026-03-28', 'Mr Mindy', 'Melamine boards', 2, 'ZITF (Telone)to be cut', '2026-03-28', '2026-03-31 14:33:08'),
(63, 59, '2026-03-31', 'Thabo', 'Vinyl (Glossy)', 1, 'HICC Business Times', '2026-03-31', '2026-03-31 14:45:39'),
(64, 87, '2026-04-01', 'Mr Brian ', 'MDF Superwood boards', 7, 'ZITF (Telone)to be cut ', '2026-04-01', '2026-04-02 08:04:56'),
(65, 87, '2026-04-01', 'Mr Brian ', 'MDF Superwood boards', 7, 'ZITF (Telone)to be cut ', '2026-04-01', '2026-04-02 08:04:57'),
(66, 102, '2026-04-03', 'Mr Mindy', 'Melamine boards', 3, 'ZANU PF', '2026-04-03', '2026-04-03 15:03:14'),
(67, 102, '2026-04-03', 'Mr Mindy ( Pavilion)', 'Melamine boards', 4, 'Pavilion ', '2026-04-03', '2026-04-03 15:09:55'),
(68, 102, '2026-04-03', 'Mr Brian ', 'Melamine boards', 2, 'TCLF', '2026-04-03', '2026-04-03 15:11:20'),
(69, 87, '2026-04-03', 'Mr Mindy ', 'MDF Superwood boards', 2, 'Pavilion Telone ', '2026-04-03', '2026-04-03 15:12:16'),
(70, 87, '2026-04-03', 'Mr Mindy ', 'MDF Superwood boards', 2, 'Pavilion Telone ', '2026-04-03', '2026-04-03 16:15:50'),
(71, 25, '2026-03-26', 'Mrs Makie', 'Flash drive', 3, 'Personal', '2026-04-30', '2026-04-11 10:04:45'),
(72, 25, '2026-03-26', 'Mrs Makie', 'Flash drive', 3, 'Personal', '2026-04-30', '2026-04-11 10:04:46'),
(73, 25, '2026-03-26', 'Mrs Makie', 'Flash drive', 3, 'Personal', '2026-04-30', '2026-04-11 10:04:46'),
(74, 25, '2026-03-26', 'Mrs Makie', 'Flash drive', 3, 'Personal', '2026-04-30', '2026-04-11 10:04:47'),
(75, 25, '2026-03-26', 'Mrs Makie', 'Flash drive', 3, 'Personal', '2026-04-30', '2026-04-11 10:04:47'),
(76, 23, '2025-12-09', 'Smith', 'Handsaw', 1, 'Personal', '2026-04-30', '2026-04-11 10:05:50'),
(77, 22, '2026-04-02', 'Last ', 'Tape measure', 1, 'Workshop', '2026-04-30', '2026-04-11 10:06:34'),
(78, 25, '2026-04-10', 'Thabo', 'Flash drive', 1, 'Workshop', '2026-04-14', '2026-04-11 10:07:20'),
(79, 22, '2026-04-10', 'Nyasha', 'Tape measure', 1, 'Personal', '2026-02-11', '2026-04-11 10:08:12'),
(80, 15, '2026-04-10', 'Nyasha, Brian, Mr Mindy, Takunda, Munashe', 'Helmet ', 5, 'Personal', '2026-04-30', '2026-04-11 10:09:31'),
(81, 59, '2026-04-10', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'RSVP', '2026-04-30', '2026-04-11 10:12:33'),
(82, 59, '2026-04-10', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'RSVP', '2026-04-30', '2026-04-11 10:12:37'),
(83, 59, '2026-04-07', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'RSVP', '2026-04-30', '2026-04-11 10:23:25'),
(84, 57, '2026-04-08', 'Rufaro', 'Jigsaw', 4, 'Not working ', '2026-04-30', '2026-04-11 11:00:28'),
(85, 76, '2026-02-10', 'Rufaro', 'Glue Genius set', 15, 'Not working ', '2026-04-30', '2026-04-11 11:02:37'),
(86, 78, '2026-02-10', 'Tanaka', 'PVC', 1, 'UZ', '2026-04-30', '2026-04-11 11:03:17'),
(87, 88, '2026-03-12', 'Tanaka', 'PVC', 1, 'UZ', '2026-04-30', '2026-04-11 11:03:50'),
(88, 88, '2026-03-12', 'Tanaka', 'PVC', 1, 'UZ', '2026-04-30', '2026-04-11 11:03:58'),
(89, 61, '2026-04-11', 'Mr Rushmore ', 'Vinyl( Matte)', 1, 'ZIMDEF AND HIT', '2026-04-11', '2026-04-11 13:53:19'),
(90, 122, '2026-04-16', 'Panashe', 'Unisign Vinyl ', 5, 'Carols Wedding ', '2026-04-16', '2026-04-16 10:19:14'),
(91, 122, '2026-04-16', 'Joash', 'Unisign Vinyl ', 2, 'Carols Wedding ', '2026-04-16', '2026-04-16 10:41:44'),
(92, 122, '2026-04-16', 'Joash', 'Unisign Vinyl ', 2, 'Carols Wedding ', '2026-04-16', '2026-04-16 10:41:45'),
(93, 59, '2026-04-13', 'Rushmore ', 'Vinyl (Glossy)', 6, 'ZITF( ZANU, GMB, HIT', '2026-04-16', '2026-04-16 11:26:49'),
(94, 78, '2026-04-16', 'Mr Rushmore ', 'PVC', 1, 'Telone', '2026-04-16', '2026-04-16 12:24:42'),
(95, 61, '2026-04-17', 'Mr Rushmore ', 'Vinyl( Matte)', 3, 'ZITF ( HIT, ZANU, GMB', '2026-04-20', '2026-04-20 11:28:00'),
(96, 61, '2026-04-18', 'Mr Rushmore ', 'Vinyl( Matte)', 3, 'ZITF( GMB)', '2026-04-20', '2026-04-20 11:29:27'),
(97, 85, '2026-04-17', 'Mr Rushmore ', 'Blue ink', 2, 'ZITF', '2026-04-20', '2026-04-20 13:02:29'),
(98, 86, '2026-04-17', 'Mr Rushmore ', 'Yellow ink', 2, 'ZITF', '2026-04-20', '2026-04-20 13:02:43'),
(99, 82, '2026-04-17', 'Mr Rushmore ', 'Black ink', 1, 'ZITF', '2026-04-20', '2026-04-20 13:03:00'),
(100, 83, '2026-04-17', 'Mr Rushmore ', 'Pink Ink', 2, 'ZITF', '2026-04-20', '2026-04-20 13:03:12'),
(101, 59, '2026-04-24', 'Mr Rushmore ', 'Vinyl (Glossy)', 1, 'Carrols Wedding ', '2026-04-24', '2026-04-24 07:31:17'),
(102, 122, '2026-04-24', 'Mr Mindy ', 'Unisign Vinyl ', 5, 'Carols Wedding ', '2026-04-24', '2026-04-24 13:10:18'),
(103, 59, '2026-04-29', 'Thabo', 'Vinyl (Glossy)', 1, 'Mazowe Amai Setup', '2026-04-29', '2026-04-29 10:14:59'),
(104, 61, '2026-04-29', 'Thabo', 'Vinyl( Matte)', 1, 'Matsika: Bhora set up', '2026-04-29', '2026-04-29 13:58:40'),
(105, 59, '2026-04-29', 'Thabo', 'Vinyl (Glossy)', 1, 'Matsika : Bhora', '2026-04-29', '2026-04-29 14:41:37'),
(106, 25, '2026-04-09', 'Thabo', 'Flash drive', 1, 'ZITF : CNC', '2026-04-09', '2026-04-29 14:44:12'),
(107, 25, '2026-04-29', 'Tanaka', 'Flash drive', 1, 'Graphics', '2026-04-29', '2026-04-29 14:44:54');

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_logs`
--

CREATE TABLE `maintenance_logs` (
  `maintenance_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `maintenance_type` varchar(255) NOT NULL,
  `service_provider` varchar(255) DEFAULT NULL,
  `service_date` date NOT NULL,
  `odometer_reading` decimal(12,2) DEFAULT NULL,
  `service_cost` decimal(12,2) DEFAULT 0.00,
  `next_service_date` date DEFAULT NULL,
  `next_service_odometer` decimal(12,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `order_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_datetime` datetime DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `deadline_datetime` datetime DEFAULT NULL,
  `boq_file` varchar(255) DEFAULT NULL,
  `artwork_file` varchar(255) DEFAULT NULL,
  `status` enum('New','Assigned','On Going','Completed') DEFAULT 'New',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ongoing_since` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `order_number`, `order_name`, `description`, `start_datetime`, `location`, `deadline_datetime`, `boq_file`, `artwork_file`, `status`, `created_at`, `ongoing_since`) VALUES
(20, '011', 'Ministry of Industry and Commerce(ZITF 2026)', 'Design and construction of a modular exhibition booth for the Ministry of Industry and Commerce at ZITF 2026. The booth includes two reception areas, product display sections (kiosk and tablet stand), branded display walls, and a private office space. Structure to be built using superwood, hardwood, and timber, with MDF panel finishes and vinyl branding. Top fascia to be finished with a PVC banner. Integrated lighting to enhance visibility and overall presentation. Designed for efficient installation and smooth visitor flow.\r\n\r\nNB: Use the link below for artwork material. https://we.tl/t-JvO40No3Yvxk8NS8', NULL, 'Bulawayo', '2026-04-18 12:00:00', 'uploads/boq_1776229128_Ministry_Industry_Commerce_BOQ.pdf', '', 'Completed', '2026-04-15 04:58:48', '2026-05-22 14:34:49');

-- --------------------------------------------------------

--
-- Table structure for table `order_assignments`
--

CREATE TABLE `order_assignments` (
  `assignment_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_image` text NOT NULL,
  `brand_id` int(11) NOT NULL,
  `categories_id` int(11) NOT NULL,
  `quantity` varchar(255) NOT NULL,
  `rate` varchar(255) NOT NULL,
  `active` int(11) NOT NULL,
  `status` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `product_name`, `product_image`, `brand_id`, `categories_id`, `quantity`, `rate`, `active`, `status`) VALUES
(13, 'Product', 'assets/images/stock/img_692efa0f0d3006.92261899.jpg', 14, 14, '24', '11', 2, 2),
(15, 'Helmet ', '../assets/images/stock/2084443398692f186b10692.jpg', 22, 16, '0', '5', 1, 1),
(16, 'Ink', '../assets/images/stock/38723834369393c61c46e6.png', 22, 16, '11', '20', 2, 2),
(17, 'Sweet', '../assets/images/stock/127526665469394323d389d.jpg', 22, 16, '6', '22', 2, 2),
(18, 'lights', '../assets/images/stock/185943669569394a031ce4c.jpg', 22, 16, '20', '12', 2, 2),
(19, 'Impact Drill ', '../assets/images/stock/255902567693952f9e6d4f.jpg', 23, 16, '6', '6', 1, 1),
(20, 'Cordless Paint Gun', '../assets/images/stock/1304001270693954d659b52.jpg', 24, 16, '3', '3', 1, 1),
(21, '(With Cord)Paint Spray Gun', '../assets/images/stock/1877714510693955fc3af4e.jpg', 24, 16, '3', '3', 1, 1),
(22, 'Tape measure', '../assets/images/stock/195879737469395cc5a7bc1.jpg', 26, 16, '2', '4', 1, 1),
(23, 'Handsaw', '../assets/images/stock/14844015296939639236d14.jpg', 27, 16, '0', '1', 1, 1),
(24, 'Powerbank', '../assets/images/stock/45676856069396478b4484.jpg', 28, 16, '2', '2', 1, 1),
(25, 'Flash drive', '../assets/images/stock/20002463756939661fde7f4.jpg', 28, 16, '12', '30', 1, 1),
(26, 'Perspex blades', '../assets/images/stock/1202652736693967749a590.jpg', 29, 16, '4', '5', 1, 1),
(27, 'Spare blades', '../assets/images/stock/33495894169396867d41f0.jpg', 29, 16, '18', '18', 1, 1),
(28, 'Baby Grinder', '../assets/images/stock/992791810693973a16e964.jpg', 27, 16, '7', '7', 1, 1),
(29, 'Angle Grinder', '../assets/images/stock/105108161869397966d3042.jpg', 23, 16, '3', '3', 1, 1),
(30, 'Laminate Trimmer', '../assets/images/stock/116679352869397a4fe80b0.jpg', 27, 16, '3', '3', 1, 1),
(31, 'Electric Soldering Iron', '../assets/images/stock/110350408869397c09a70e6.jpg', 24, 16, '3', '3', 1, 1),
(32, 'Hot Glue Gun', '../assets/images/stock/79094696469397ccdd90d7.jpg', 30, 16, '1', '1', 1, 1),
(33, 'Test meter', '../assets/images/stock/89752117469397d612c344.jpg', 30, 16, '2', '2', 1, 1),
(34, 'Utility knife', '../assets/images/stock/11892682036939857d4b3bf.jpg', 27, 16, '8', '11', 1, 1),
(35, 'Wood Chisel', '../assets/images/stock/2044131371693985f68f7f1.jpg', 27, 16, '17', '18', 1, 1),
(36, 'Iron Plane For Wood', '../assets/images/stock/1246453771693986615f1f1.jpg', 30, 16, '5', '5', 1, 1),
(37, 'Combination Pliers', '../assets/images/stock/342458305693bd70f22122.jpg', 27, 16, '2', '2', 1, 1),
(38, 'Long Nose Pliers', '../assets/images/stock/1714860910693bd7f8cdc2c.jpg', 27, 16, '4', '4', 1, 1),
(39, 'Cutting Pliers', '../assets/images/stock/1579047212693bd9511795c.jpg', 27, 16, '3', '3', 1, 1),
(40, 'Wire Tripped Pliers', '../assets/images/stock/1376718950693bdc77a9278.jpg', 24, 16, '3', '3', 1, 1),
(41, 'Screwdriver set', '../assets/images/stock/977855198693bde12ca940.jpg', 24, 16, '1', '1', 1, 1),
(42, 'Spirit Level', '../assets/images/stock/318596802693bdefcd8068.jpg', 27, 16, '1', '1', 1, 1),
(43, 'Star screwdriver ', '../assets/images/stock/1776520813693bfc1de806b.jpg', 27, 16, '2', '2', 1, 1),
(44, 'Flat screwdriver ', '../assets/images/stock/787707996693bfcc3ee5fd.jpg', 23, 16, '13', '13', 1, 1),
(45, 'Claw hammer ', '../assets/images/stock/1191377180693bfe2219f37.jpg', 23, 16, '7', '5', 1, 1),
(46, 'Rubber mallet', '../assets/images/stock/36185602693c01621f88f.jpg', 30, 16, '7', '7', 1, 1),
(47, 'Total Waist belt pockets', '../assets/images/stock/2088006708693c02181cd99.jpg', 27, 16, '1', '1', 1, 1),
(48, 'Total Waist belt pockets', '../assets/images/stock/1176676709693c160d21539.jpg', 27, 16, '1', '1', 1, 1),
(49, 'Total Vest', '../assets/images/stock/379479213693c16f3949e0.jpg', 27, 16, '1', '1', 1, 1),
(50, 'Battery Big', '../assets/images/stock/77986017693c173761d61.jpg', 23, 16, '7', '5', 1, 1),
(51, 'Batteries Small', '../assets/images/stock/1267075674693c178654978.jpg', 23, 16, '8', '8', 1, 1),
(52, 'Battery chargers ( double and single)', '../assets/images/stock/1682263373693c17de9fc58.jpg', 23, 16, '13', '13', 1, 1),
(53, 'G-Clamps', '../assets/images/stock/1359796187693c183c639db.jpg', 27, 16, '14', '14', 1, 1),
(54, 'Silicone Guns', '../assets/images/stock/942154621693c18fd277c6.jpg', 23, 16, '4', '4', 1, 1),
(55, 'Circular Saw', '../assets/images/stock/1908131138693c1f6d1a184.jpg', 23, 16, '9', '9', 1, 1),
(56, 'Drill ', '../assets/images/stock/19377171693c3a8f51b07.jpg', 23, 16, '6', '6', 1, 1),
(57, 'Jigsaw', '../assets/images/stock/72736102693c440d4b176.jpg', 23, 16, '1', '5', 1, 1),
(58, 'Shovel ', '../assets/images/stock/156738384693c44861520d.jpg', 23, 16, '3', '3', 1, 1),
(59, 'Vinyl (Glossy)', '../assets/images/stock/864992320693fb15706de9.jpg', 29, 18, '4', '1.52', 1, 1),
(60, 'Oraguard( Laminate film)', '../assets/images/stock/1266016736693fb1d5e619a.jpg', 31, 18, '4', '1370', 1, 1),
(61, 'Vinyl( Matte)', '../assets/images/stock/656474301693fb2450b5a8.jpg', 29, 18, '5', '1370', 1, 1),
(62, 'Electric Router', '../assets/images/stock/481875557694016c2f2b12.jpg', 24, 16, '1', '1', 1, 1),
(63, 'Rotary Hammer ', '../assets/images/stock/159137754169401800793e8.jpg', 27, 16, '2', '2', 1, 1),
(64, 'Impact Wrench', '../assets/images/stock/192445077569401bc802e93.jpg', 27, 16, '2', '2', 1, 1),
(65, 'Mitre Saw', '../assets/images/stock/11419667966940227449965.jpg', 27, 16, '2', '2', 1, 1),
(66, 'Work Lamb', '../assets/images/stock/897260714694022fb3acb9.jpg', 27, 16, '1', '1', 1, 1),
(67, 'Heat Gun', '../assets/images/stock/359917086940234753f52.jpg', 23, 16, '2', '2', 1, 1),
(68, 'Air Blow Gun', '../assets/images/stock/7414935596940240e3c7a4.jpg', 24, 16, '3', '3', 1, 1),
(69, 'Nail Gun', '../assets/images/stock/784047427694024de37133.jpg', 24, 16, '8', '8', 1, 1),
(70, 'Welding machine ', '../assets/images/stock/116424667569402537b71a5.jpg', 24, 16, '2', '2', 1, 1),
(71, 'Welders Apron ', '../assets/images/stock/19382027336941021c92148.jpg', 30, 16, '1', '0', 1, 1),
(72, 'Welding Goggles ', '../assets/images/stock/5230908386941028f48ba5.jpg', 30, 16, '3', '0', 1, 1),
(73, 'Telescopic ladder', '../assets/images/stock/8457079616941031b7781f.jpg', 27, 16, '4', '0', 1, 1),
(74, 'Ceramic flower pot', '../assets/images/stock/48295574669410e0f54211.jpg', 30, 16, '4', '0', 1, 1),
(75, 'Gloss vinyl black', '../assets/images/stock/901230876943b0f456e4a.jpg', 29, 18, '0', '1', 2, 1),
(76, 'Glue Genius set', '../assets/images/stock/17652682176943e696a7ab4.jpg', 30, 18, '1', '200', 1, 1),
(77, 'AAA Battery', '../assets/images/stock/17522569736943e75d28f82.jpg', 30, 18, '50', '50', 1, 1),
(78, 'PVC', '../assets/images/stock/365387544697c8f7150d01.jpg', 29, 18, '0', '1.3', 1, 1),
(79, 'Combination Spanner set ', '../assets/images/stock/151307647869931826e21fc.jpg', 27, 16, '2', '10', 1, 1),
(80, 'Black case', '../assets/images/stock/3839339916993197822ff4.jpg', 28, 16, '12', '6', 2, 2),
(81, 'Combination spanner set( 6mm- 22mm)', '../assets/images/stock/92609152769931bd24a8b9.jpg', 30, 16, '12', '6', 1, 1),
(82, 'Black ink', '../assets/images/stock/52902949369931dd8accfd.jpg', 32, 18, '3', '1', 1, 1),
(83, 'Pink Ink', '../assets/images/stock/131655326069931e2958fee.jpg', 32, 18, '0', '1', 1, 1),
(84, 'Blue ink', '../assets/images/stock/4566735036998606da7e04.jpg', 32, 18, '4', '1', 2, 2),
(85, 'Blue ink', '../assets/images/stock/1473364330699860717c7c8.jpg', 32, 18, '0', '1', 1, 1),
(86, 'Yellow ink', '../assets/images/stock/11399191699860cf7aef7.jpg', 32, 18, '1', '1', 1, 1),
(87, 'MDF Superwood boards', '../assets/images/stock/155961080369c3b8a365af8.jpg', 35, 19, '0', '16', 1, 1),
(88, 'PVC', '../assets/images/stock/209146147969c3d017a7596.jpg', 29, 18, '0', '1.6', 1, 1),
(89, 'Brochure Stand', '../assets/images/stock/39909673569c4c7aa7a18b.jpg', 29, 16, '16', '0', 1, 1),
(90, 'White Single Couch ', '../assets/images/stock/103318416869c4c9421883e.jpg', 28, 20, '20', '0', 1, 1),
(91, 'Trestle Table', '../assets/images/stock/210805289469c4c9fe31473.jpg', 28, 20, '83', '0', 1, 1),
(92, 'White Double Couches ', '../assets/images/stock/55089101769c4caa58937c.jpg', 28, 20, '20', '2', 1, 1),
(93, 'White cube seats', '../assets/images/stock/171105140469c4ce1adecc1.jpg', 28, 20, '34', '0', 1, 1),
(94, 'Blue cube seats', '../assets/images/stock/51516076869c4ce9ebc15d.jpg', 28, 20, '7', '0', 1, 1),
(95, 'Blue cube seats', 'assets/images/stock/img_69c523e1935346.45652491.jpg', 28, 20, '7', '0', 2, 2),
(96, 'Measuring wheel', '../assets/images/stock/90673894769c50cccbe9b8.jpg', 30, 16, '1', '0', 1, 1),
(97, 'Measuring wheel', '../assets/images/stock/52755345969c50d2420168.jpg', 30, 16, '1', '0', 1, 1),
(98, 'Measuring wheel ', '../assets/images/stock/196264969269c5105342f54.jpg', 30, 16, '1', '0', 1, 1),
(99, 'Orange cube seats', '../assets/images/stock/163142323869c515c298dd0.jpg', 28, 20, '3', '0', 1, 1),
(100, 'Red cube seats', '../assets/images/stock/190115860469c52468699fc.jpg', 28, 20, '2', '0', 1, 1),
(101, 'Lime cube seats', '../assets/images/stock/161283034069c524d5ea8b3.jpg', 28, 20, '10', '0', 1, 1),
(102, 'Melamine boards', '../assets/images/stock/11807558369c5329606f72.jpg', 35, 19, '111', '2750', 1, 1),
(103, 'Melamine boards ', '../assets/images/stock/91544622669c533c21b2d5.jpg', 35, 19, '11', '2500', 1, 1),
(104, 'Melamine boards ', '../assets/images/stock/131610860669c53420d916c.jpg', 35, 19, '11', '2500', 2, 2),
(105, 'Lime green double couches ( to changed to blue)', '../assets/images/stock/89181275069c5350ebf912.jpg', 28, 20, '2', '2', 1, 1),
(106, 'Blue bin bag', '../assets/images/stock/17138231069c535865517c.jpg', 28, 20, '2', '0', 1, 1),
(107, 'White dining chairs ', '../assets/images/stock/214152685969c535c6d99e4.jpg', 28, 20, '6', '0', 1, 1),
(108, 'Cushions mixed', '../assets/images/stock/56288838669c5360f2bef2.jpg', 28, 20, '14', '0', 1, 1),
(109, 'Orange bin bags', '../assets/images/stock/67581523169c5369a89382.jpg', 28, 20, '0', '3', 1, 1),
(110, 'Round single seater', '../assets/images/stock/177764961769c538f0cd6a6.jpg', 28, 20, '6', '0', 1, 1),
(111, 'Air cooler ', '../assets/images/stock/196695806969c53a01cd13b.jpg', 28, 21, '11', '0', 1, 1),
(112, 'Air cooler', '../assets/images/stock/50226314969c53a4aa83fe.jpg', 28, 21, '6', '0', 1, 1),
(113, 'Black fans', '../assets/images/stock/205373743469c53ae722351.jpg', 28, 21, '19', '0', 1, 1),
(114, 'Black fans', '../assets/images/stock/149385989969c53b3dcc786.jpg', 28, 21, '19', '0', 2, 2),
(115, 'Coffee machines ', '../assets/images/stock/6124795269c53b7ccd957.jpg', 28, 21, '2', '0', 1, 1),
(116, 'Foldable white chairs', '../assets/images/stock/187160356169c53cd4bdf71.jpg', 28, 20, '13', '0', 1, 1),
(117, 'Metal framed Cocktail Tables', '../assets/images/stock/60274958969c53d6c6d759.jpg', 28, 20, '19', '0', 1, 1),
(118, 'White bar stools ', '../assets/images/stock/182622447969c53dd0d01e5.jpg', 28, 20, '39', '0', 1, 1),
(119, 'Black Bins ', '../assets/images/stock/18754742069c53e95b49b3.jpg', 28, 20, '59', '0', 1, 1),
(120, '16mm Plywood ', '../assets/images/stock/12127999069c53fe883a35.jpg', 35, 19, '455', '0', 1, 1),
(121, '19mm Plywood ', '../assets/images/stock/132346968169c6840c324ab.jpg', 35, 19, '165', '2750', 1, 1),
(122, 'Unisign Vinyl ', '../assets/images/stock/57585920569da23ae5fae5.jpg', 29, 18, '9', '1.37', 1, 1),
(123, 'Ladders ', '../assets/images/stock/69770765469da2472ef024.jpg', 27, 16, '5', '0', 1, 1),
(124, 'Strip lights ( New)', '../assets/images/stock/168297362269da24ec247ff.jpg', 28, 21, '8', '50', 1, 1),
(125, 'LED RGM Bulb', '../assets/images/stock/128455148369da25d043fd1.jpg', 28, 21, '5', '0', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `quotations`
--

CREATE TABLE `quotations` (
  `quotation_id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_number` varchar(20) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_id` varchar(100) DEFAULT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `order_number` varchar(100) DEFAULT NULL,
  `quote_date` date NOT NULL,
  `terms_conditions` text DEFAULT NULL,
  `design_file` varchar(255) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('Pending','Approved') NOT NULL DEFAULT 'Pending',
  `submitted_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`quotation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quotation_items`
--

CREATE TABLE `quotation_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `design_jobs`
--

CREATE TABLE `design_jobs` (
  `design_job_id` int(11) NOT NULL AUTO_INCREMENT,
  `job_number` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `design_type` enum('3D','Artwork') NOT NULL,
  `deadline` datetime NOT NULL,
  `brief_file` varchar(255) DEFAULT NULL,
  `submission_file` varchar(255) DEFAULT NULL,
  `submission_notes` text DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `status` enum('Assigned','Submitted','Revision Requested','Approved') NOT NULL DEFAULT 'Assigned',
  `marketer_id` int(11) DEFAULT NULL,
  `designer_id` int(11) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`design_job_id`),
  UNIQUE KEY `job_number` (`job_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `memos`
--

CREATE TABLE `memos` (
  `memo_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` datetime NOT NULL,
  `status` enum('Pending','Done') NOT NULL DEFAULT 'Pending',
  `acknowledged_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`memo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `requisitions`
--

CREATE TABLE `requisitions` (
  `requisition_id` int(11) NOT NULL,
  `req_number` varchar(20) NOT NULL,
  `project_manager` varchar(255) NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `event_date` date NOT NULL,
  `team_members` text DEFAULT NULL,
  `req_type` varchar(100) NOT NULL,
  `req_type_other` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Processed','Approved','Rejected') DEFAULT 'Pending',
  `submitted_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `requisitions`
--

INSERT INTO `requisitions` (`requisition_id`, `req_number`, `project_manager`, `event_name`, `location`, `event_date`, `team_members`, `req_type`, `req_type_other`, `status`, `submitted_by`, `created_at`, `processed_by`, `processed_at`) VALUES
(1, 'REQ-001', 'Nyasha', 'ZITF', 'Bulawayo', '2026-04-20', 'Smith\r\nNyasha\r\nBooker\r\nWelly', 'Food', '', 'Pending', NULL, '2026-04-12 05:26:24', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `surname` varchar(100) NOT NULL,
  `user_type` varchar(50) NOT NULL,
  `department` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `name`, `surname`, `user_type`, `department`, `password`, `email`) VALUES
(11, 'RuruP', 'Vanessa Rufaro', 'Pariyani', 'Stores Admin', 'Stores Admin', '$2y$10$ffIejq7T3OkeKSzHDRIbH.yoWVznkq/b4ZghmMIFOt64GaTDxnhNO', 'rufaropariyani25@gmail.com'),
(12, '@superkey', 'Managing', 'Director', 'Super Admin', 'Super Admin', '$2y$10$6Juq3gFMxkmft/SMDNJmBuSCngT/1UU46O1d.avq9XrtgVYpTzXEO', 'managingdirector@gmail.com'),
(17, '@cavy', 'Calvin', 'Fonso', 'Stores Admin', 'Stores Admin', '$2y$10$lsKzmva1yhR5Us5.v0rANObhVlgKYBmwmIvEAe4QFz9UoKyvIMiN2', 'calvinfonso17@gmail.com'),
(20, 'Peter', 'Peter', 'Muchairi', 'Stores Admin', 'Stores', '$2y$10$cmSj5/tBkaihEP4zmTpXPORnsOR4LP7Zqz9E3b0G/jQUnNihoV.oa', 'petermuchairi4@gmail.com'),
(21, '@project', 'Munashe', 'Doe', 'Project Manager', 'Management', '$2y$10$y6wE8rozkpKse16owaFUY.CuwAApT9FIeBB2YHUHDI1T3hYC8vGDu', 'munashefonso17@gmail.com'),
(22, '@production', 'Munashe', 'Doe', 'Production Team', 'Production', '$2y$10$1LXvX7W2PpPWuzG8NgztuOOMv.prh0kRDE2Y5XF2ksp4MADqRO03G', 'munashefonso17@gmail.com'),
(23, '@graphics', 'Munashe', 'Chisaya', 'Graphic Designer', 'Graphics Department', '$2y$10$umKM0pb0CuVGHzYk9EK8xOce/B6zWrI2RewYept97PsHR7Hahy5gS', 'storesadmin@gmail.com'),
(24, '@driver', 'Munashe', 'Doe', 'Logistics', 'Logistics', '$2y$10$fiB7yUZ5OEdAQ2T6lfNmAufK0KiQjV1wIISuOCdLyRdKZ1.xe8bbq', 'storesadmin@gmail.com'),
(25, '@accounts', 'Rufaro', 'Doe', 'Accountant', 'Accounts', '$2y$10$SkQhc3XjWelk/nKclOC0wO6nTDHCtq0A848c1s2NvEYLp8YVfL2iS', 'storesadmin@gmail.com'),
(26, 'ACCOUNTS', 'LINDIWE', 'MULENGA', 'Accountant', 'Accounts', '$2y$10$o0GSFm5uc6XK8MYT.qRqjelu5m10UNSxzUkNKW6uPeafKAgCNDG8e', 'accounts@showcaseit.co.zw');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `vehicle_id` int(11) NOT NULL,
  `registration_number` varchar(50) NOT NULL,
  `make` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `vehicle_year` year(4) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `fuel_type` enum('Petrol','Diesel','Hybrid','Electric') NOT NULL DEFAULT 'Diesel',
  `capacity` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `assigned_user` int(11) DEFAULT NULL,
  `status` enum('Available','On Trip','Under Maintenance','Out of Service') DEFAULT 'Available',
  `purchase_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`vehicle_id`, `registration_number`, `make`, `model`, `vehicle_year`, `color`, `fuel_type`, `capacity`, `department`, `assigned_user`, `status`, `purchase_date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'ADG2399', 'TOYOTA', 'Land Cruiser Prado', '2024', 'White', 'Diesel', '2300kg', 'Logistics', NULL, 'On Trip', '2026-06-03', '', '2026-06-03 08:49:45', '2026-06-03 11:46:53');

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_documents`
--

CREATE TABLE `vehicle_documents` (
  `document_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `document_type` enum('Insurance','Vehicle Licence','Fitness Certificate','Road Tax','Registration Book','Other') NOT NULL,
  `document_number` varchar(100) NOT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `reminder_days` int(11) DEFAULT 30,
  `document_file` varchar(255) DEFAULT NULL,
  `status` enum('Valid','Expiring Soon','Expired') DEFAULT 'Valid',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `uploaded_file` varchar(255) DEFAULT NULL,
  `previous_document_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_trips`
--

CREATE TABLE `vehicle_trips` (
  `trip_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `destination` varchar(255) NOT NULL,
  `purpose` text DEFAULT NULL,
  `departure_datetime` datetime NOT NULL,
  `return_datetime` datetime DEFAULT NULL,
  `odometer_start` decimal(12,2) NOT NULL,
  `odometer_end` decimal(12,2) DEFAULT NULL,
  `distance_travelled` decimal(12,2) DEFAULT 0.00,
  `trip_status` enum('Planned','Active','Completed','Cancelled') DEFAULT 'Planned',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_shifts`
--

CREATE TABLE `work_shifts` (
  `shift_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `shift_date` date NOT NULL,
  `login_time` datetime NOT NULL,
  `evening_shift` tinyint(1) NOT NULL DEFAULT 0,
  `logout_time` datetime DEFAULT NULL,
  PRIMARY KEY (`shift_id`),
  UNIQUE KEY `user_shift_date` (`user_id`,`shift_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_tasks`
--

CREATE TABLE `work_tasks` (
  `task_id` int(11) NOT NULL AUTO_INCREMENT,
  `shift_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `task_notes` text DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `status` enum('Running','Completed') NOT NULL DEFAULT 'Running',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `boq`
--
ALTER TABLE `boq`
  ADD PRIMARY KEY (`boq_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `boq_items`
--
ALTER TABLE `boq_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `boq_id` (`boq_id`);

--
-- Indexes for table `brand`
--
ALTER TABLE `brand`
  ADD PRIMARY KEY (`brand_id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`categories_id`);

--
-- Indexes for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  ADD PRIMARY KEY (`fuel_id`),
  ADD KEY `idx_fuel_vehicle` (`vehicle_id`);

--
-- Indexes for table `issued_tools`
--
ALTER TABLE `issued_tools`
  ADD PRIMARY KEY (`issue_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  ADD PRIMARY KEY (`maintenance_id`),
  ADD KEY `idx_maintenance_vehicle` (`vehicle_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_number` (`order_number`);

--
-- Indexes for table `order_assignments`
--
ALTER TABLE `order_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`);

--
-- Indexes for table `requisitions`
--
ALTER TABLE `requisitions`
  ADD PRIMARY KEY (`requisition_id`),
  ADD UNIQUE KEY `req_number` (`req_number`),
  ADD KEY `req_user_fk` (`submitted_by`),
  ADD KEY `req_processed_by_fk` (`processed_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`vehicle_id`),
  ADD UNIQUE KEY `registration_number` (`registration_number`),
  ADD KEY `fk_vehicle_user` (`assigned_user`),
  ADD KEY `idx_vehicle_status` (`status`),
  ADD KEY `idx_vehicle_reg` (`registration_number`);

--
-- Indexes for table `vehicle_documents`
--
ALTER TABLE `vehicle_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `idx_document_vehicle` (`vehicle_id`),
  ADD KEY `idx_document_expiry` (`expiry_date`);

--
-- Indexes for table `vehicle_trips`
--
ALTER TABLE `vehicle_trips`
  ADD PRIMARY KEY (`trip_id`),
  ADD KEY `idx_trip_vehicle` (`vehicle_id`),
  ADD KEY `idx_trip_user` (`user_id`),
  ADD KEY `idx_trip_status` (`trip_status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `boq`
--
ALTER TABLE `boq`
  MODIFY `boq_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `boq_items`
--
ALTER TABLE `boq_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `brand`
--
ALTER TABLE `brand`
  MODIFY `brand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `categories_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  MODIFY `fuel_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `issued_tools`
--
ALTER TABLE `issued_tools`
  MODIFY `issue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=108;

--
-- AUTO_INCREMENT for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  MODIFY `maintenance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `order_assignments`
--
ALTER TABLE `order_assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126;

--
-- AUTO_INCREMENT for table `requisitions`
--
ALTER TABLE `requisitions`
  MODIFY `requisition_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `vehicle_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `vehicle_documents`
--
ALTER TABLE `vehicle_documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicle_trips`
--
ALTER TABLE `vehicle_trips`
  MODIFY `trip_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `boq`
--
ALTER TABLE `boq`
  ADD CONSTRAINT `boq_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `boq_items`
--
ALTER TABLE `boq_items`
  ADD CONSTRAINT `boq_items_ibfk_1` FOREIGN KEY (`boq_id`) REFERENCES `boq` (`boq_id`) ON DELETE CASCADE;

--
-- Constraints for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  ADD CONSTRAINT `fk_fuel_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `issued_tools`
--
ALTER TABLE `issued_tools`
  ADD CONSTRAINT `issued_tools_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`);

--
-- Constraints for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  ADD CONSTRAINT `fk_maintenance_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_assignments`
--
ALTER TABLE `order_assignments`
  ADD CONSTRAINT `order_assignments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_assignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `quotations`
--
ALTER TABLE `quotations`
  ADD CONSTRAINT `quo_submitted_by_fk` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `quo_approved_by_fk` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD CONSTRAINT `quotation_items_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`quotation_id`) ON DELETE CASCADE;

--
-- Constraints for table `requisitions`
--
ALTER TABLE `requisitions`
  ADD CONSTRAINT `req_processed_by_fk` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `req_user_fk` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `design_jobs`
--
ALTER TABLE `design_jobs`
  ADD CONSTRAINT `dj_marketer_fk` FOREIGN KEY (`marketer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `dj_designer_fk` FOREIGN KEY (`designer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `memos`
--
ALTER TABLE `memos`
  ADD CONSTRAINT `memo_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `work_shifts`
--
ALTER TABLE `work_shifts`
  ADD CONSTRAINT `ws_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `work_tasks`
--
ALTER TABLE `work_tasks`
  ADD CONSTRAINT `wt_shift_fk` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`shift_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wt_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicle_user` FOREIGN KEY (`assigned_user`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `vehicle_documents`
--
ALTER TABLE `vehicle_documents`
  ADD CONSTRAINT `fk_document_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vehicle_trips`
--
ALTER TABLE `vehicle_trips`
  ADD CONSTRAINT `fk_trip_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_trip_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
