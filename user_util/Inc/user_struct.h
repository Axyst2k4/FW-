#ifndef USER_STRUCT_H
#define USER_STRUCT_H

#include "stm32l0xx_hal.h"
#include "stm32l0xx.h"

typedef struct
{
	uint8_t			*Data_a8;					// string
	uint16_t		Length_u16;
} sData;

#endif	/* USER_UTIL_H */
