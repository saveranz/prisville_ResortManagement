-- Clear existing day pass walk-in records
TRUNCATE TABLE day_pass_walk_in;

-- Insert day pass walk-in data
-- Note: Cottage types mapped as follows:
-- "Kubo" -> kubo
-- "Cottage" or "Concrete" -> concrete
-- "Swimming" or "(Cash Out)" -> kubo (default)
-- Time of day: Assuming all are "day" since not specified

-- April 02, 2026 - Judith, Kubo, 600 = 22pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Judith', 22, 'kubo', 'day', 600.00, '2026-04-02');

-- April 03, 2026 - Francis Bryan L. Aligata, Kubo, 400 = 9 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Francis Bryan L. Aligata', 9, 'kubo', 'day', 400.00, '2026-04-03');

-- April 04, 2026 - Ronilo Seco, Cottage, 400 = 9 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Ronilo Seco', 9, 'concrete', 'day', 400.00, '2026-04-04');

-- April 05, 2026 - Kier, cottage 500 = 17pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Kier', 17, 'concrete', 'day', 500.00, '2026-04-05');

-- April 06, 2026 - Gabriel Princes D. Rosas, Concrete, 500 = 13 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Gabriel Princes D. Rosas', 13, 'concrete', 'day', 500.00, '2026-04-06');

-- April 07, 2026 - Dane Urbano, Kubo, 500 = 16 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Dane Urbano', 16, 'kubo', 'day', 500.00, '2026-04-07');

-- April 09, 2026 - Eli Doce, Concrete, 400 = 8 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Eli Doce', 8, 'concrete', 'day', 400.00, '2026-04-09');

-- April 10, 2026 - Mary Rose Arellano, Kubo, 500 = 14 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Mary Rose Arellano', 14, 'kubo', 'day', 500.00, '2026-04-10');

-- April 11, 2026 - Mary Ann M. Jalac, Kubo, 500 = 16 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Mary Ann M. Jalac', 16, 'kubo', 'day', 500.00, '2026-04-11');

-- April 12, 2026 - Andrea, Concrete, 400 = 7 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Andrea', 7, 'concrete', 'day', 400.00, '2026-04-12');

-- April 13, 2026 - Anthony, Cottage, 500 = 8 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Anthony', 8, 'concrete', 'day', 500.00, '2026-04-13');

-- April 14, 2026 - Dianne, Kubo, 500 = 19 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Dianne', 19, 'kubo', 'day', 500.00, '2026-04-14');

-- April 15, 2026 - Queenie, Cottage, 500 = 9 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Queenie', 9, 'concrete', 'day', 500.00, '2026-04-15');

-- April 17, 2026 - Jessica, Cottage, 500 = 15 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Jessica', 15, 'concrete', 'day', 500.00, '2026-04-17');

-- April 20, 2026 - Jelo, Swimming, 500 = 12 pax (Swimming mapped to kubo)
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Jelo', 12, 'kubo', 'day', 500.00, '2026-04-20');

-- April 23, 2026 - Nonato M. Sarmiento, Kubo, 500 = 10 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Nonato M. Sarmiento', 10, 'kubo', 'day', 500.00, '2026-04-23');

-- April 24, 2026 - Khim, Kubo, 500 = 7 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Khim', 7, 'kubo', 'day', 500.00, '2026-04-24');

-- April 26, 2026 - Jhackielyn Libres, Kubo, 500 = 12 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Jhackielyn Libres', 12, 'kubo', 'day', 500.00, '2026-04-26');

-- April 27, 2026 - Princess, Cottage, 400 = 13 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Princess', 13, 'concrete', 'day', 400.00, '2026-04-27');

-- April 28, 2026 - Diane, (Cash Out), 100 = 14 pax (Cash Out mapped to kubo)
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Diane', 14, 'kubo', 'day', 100.00, '2026-04-28');

-- April 29, 2026 - Jian, Kubo 500 = 9 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Jian', 9, 'kubo', 'day', 500.00, '2026-04-29');

-- May 02, 2026 - Mary Grace Manalo, 2 Kubo, 1,000 = 10 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Mary Grace Manalo', 10, 'kubo', 'day', 1000.00, '2026-05-02');

-- May 03, 2026 - Eloisa Villanueva, Batch 2007, 2,550 = 15 pax (Batch mapped to concrete)
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Eloisa Villanueva', 15, 'concrete', 'day', 2550.00, '2026-05-03');

-- May 04, 2026 - Lorena Famerial, Concrete, 400 = 12 pax
INSERT INTO day_pass_walk_in (representative_name, number_of_pax, cottage_type, time_of_day, total_amount, created_at) 
VALUES ('Lorena Famerial', 12, 'concrete', 'day', 400.00, '2026-05-04');

-- Total: 25 records inserted
SELECT 'Day pass walk-in data inserted successfully!' as message;
