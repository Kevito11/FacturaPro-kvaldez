USE [master]
GO

-- 1. Crear el sistema de inicio de sesión (Login)
-- (Puedes cambiar "FacturaUser" y "FacturaP@ssw0rd!" por lo que desees)
CREATE LOGIN FacturaUser WITH PASSWORD = 'FacturaP@ssw0rd!';
GO

-- 2. Entrar a nuestra base de datos específica
USE FacturaPro
GO

-- 3. Crear el usuario dentro de la base de datos asociado al Login
CREATE USER FacturaUser FOR LOGIN FacturaUser;
GO

-- 4. Darle permisos de dueño sobre FacturaPro (Leer, escribir, borrar)
ALTER ROLE db_owner ADD MEMBER FacturaUser;
GO
