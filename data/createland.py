import os 

pwd = os.getcwd();
file = open('%s/createland.sql' % (pwd) , 'w')
cont = 0

file.write("DELETE from buffer;\n")
file.write("DELETE from land;\n")
file.write("DELETE from properties;\n")
file.write("DELETE from interseccion_upz_redprimaria;\n")
file.write("DELETE from red_primaria;\n")
file.write("DELETE from upz;\n")

for i in range(0,13):
	for j in range(0,16):
		file.write('INSERT INTO land VALUES (%d,%f,%f,20,NULL,1);\n' % (cont, 6.247840 + i*0.1, -127.280116 + j*0.1))
		file.write('UPDATE land SET geom = (SELECT ST_SetSRID(ST_MakePoint((SELECT longitude FROM land WHERE gid = %d),(SELECT latitude FROM land WHERE gid = %d)),4326))  WHERE gid = %d;\n' % (cont,cont,cont))
		
		file.write('INSERT INTO properties VALUES (%d,NULL,%f,%f,20,2,20,NULL);\n' % (cont, 6.247840 + i*0.1, -127.280116 + j*0.1))
		file.write('UPDATE properties SET geom = (SELECT ST_SetSRID(ST_MakePoint((SELECT longitude FROM properties WHERE gid = %d),(SELECT latitude FROM properties WHERE gid = %d)),4326))  WHERE gid = %d;\n' % (cont,cont,cont))

		file.write("INSERT INTO buffer VALUES (%d,NULL,%d);\n" % (cont,cont))
		file.write("UPDATE buffer SET geom = (SELECT ST_Buffer((SELECT geom FROM land WHERE gid = %d),0.3)) WHERE id = %d;\n" % (cont,cont))
		cont = cont + 1

file.write("INSERT INTO red_primaria (gid,geom) VALUES (0,NULL);\n")
file.write("INSERT INTO red_primaria (gid,geom) VALUES (1,NULL);\n")
file.write("INSERT INTO red_primaria (gid,geom) VALUES (2,NULL);\n")
file.write("INSERT INTO red_primaria (gid,geom) VALUES (3,NULL);\n")
file.write("INSERT INTO red_primaria (gid,geom) VALUES (4,NULL);\n")
file.write("INSERT INTO red_primaria (gid,geom) VALUES (5,NULL);\n")
file.write("INSERT INTO red_primaria (gid,geom) VALUES (6,NULL);\n")
file.write("INSERT INTO red_primaria (gid,geom) VALUES (7,NULL);\n")
file.write("UPDATE red_primaria SET geom = (SELECT ST_SetSRID(ST_GeomFromText('MULTILINESTRING((-127.280116 6.24784,-125.680116 7.54784))'),4326)) WHERE gid = 0;\n")
file.write("UPDATE red_primaria SET geom = (SELECT ST_SetSRID(ST_GeomFromText('MULTILINESTRING((-127.280116 7.54784,-125.680116 6.24784))'),4326)) WHERE gid = 1;\n")
file.write("UPDATE red_primaria SET geom = (SELECT ST_SetSRID(ST_GeomFromText('MULTILINESTRING((-126.480116 7.54784,-126.480116 6.24784))'),4326)) WHERE gid = 2;\n")
file.write("UPDATE red_primaria SET geom = (SELECT ST_SetSRID(ST_GeomFromText('MULTILINESTRING((-127.280116 6.89784,-125.680116 6.89784))'),4326)) WHERE gid = 3;\n")
file.write("UPDATE red_primaria SET geom = (SELECT ST_SetSRID(ST_GeomFromText('MULTILINESTRING((-126.680116 6.89784,-126.480116 6.69784))'),4326)) WHERE gid = 4;\n")
file.write("UPDATE red_primaria SET geom = (SELECT ST_SetSRID(ST_GeomFromText('MULTILINESTRING((-126.680116 6.89784,-126.480116 7.09784))'),4326)) WHERE gid = 5;\n")
file.write("UPDATE red_primaria SET geom = (SELECT ST_SetSRID(ST_GeomFromText('MULTILINESTRING((-126.280116 6.89784,-126.480116 7.09784))'),4326)) WHERE gid = 6;\n")
file.write("UPDATE red_primaria SET geom = (SELECT ST_SetSRID(ST_GeomFromText('MULTILINESTRING((-126.280116 6.89784,-126.480116 6.69784))'),4326)) WHERE gid = 7;\n")
file.write("INSERT INTO upz (gid,objectid,codigo_upz) VALUES (1,1,1);\n")
file.write("INSERT INTO interseccion_upz_redprimaria VALUES (0,0,1);\n")
file.write("INSERT INTO interseccion_upz_redprimaria VALUES (1,1,1);\n")
file.write("INSERT INTO interseccion_upz_redprimaria VALUES (2,2,1);\n")
file.write("INSERT INTO interseccion_upz_redprimaria VALUES (3,3,1);\n")
file.write("INSERT INTO interseccion_upz_redprimaria VALUES (4,4,1);\n")
file.write("INSERT INTO interseccion_upz_redprimaria VALUES (5,5,1);\n")
file.write("INSERT INTO interseccion_upz_redprimaria VALUES (6,6,1);\n")
file.write("INSERT INTO interseccion_upz_redprimaria VALUES (7,7,1);\n")


