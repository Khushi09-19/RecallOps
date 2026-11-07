USE recallops;
SHOW TABLES;
CREATE USER IF NOT EXISTS 'recallops_app'@'localhost'
IDENTIFIED BY 'khushi';

GRANT ALL PRIVILEGES ON recallops.*
TO 'recallops_app'@'localhost';

FLUSH PRIVILEGES;