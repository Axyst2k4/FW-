#ifndef USER_I2C_H_
#define USER_I2C_H_

#include "i2c.h"

/* Define --------------------------------------------------------------------*/
#ifdef DEVICE_TYPE_STATION
#else
	#define i2c_external_rtc      hi2c1
#endif

/* Exported functions prototypes ---------------------------------------------*/
void Init_I2C_Module (void);

#endif /* USER_I2C_H_ */
