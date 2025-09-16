/**
  * @file    adc.h
  * @brief   This file contains all the function prototypes for
  *          the adc.c file
  */

/* Define to prevent recursive inclusion -------------------------------------*/
#ifndef __ADC_H__
#define __ADC_H__

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "main.h"

/* External variables --------------------------------------------------------*/
extern ADC_HandleTypeDef hadc;

/* Exported functions prototypes ---------------------------------------------*/
void MX_ADC_Init(void);

#ifdef __cplusplus
}
#endif

#endif /* __ADC_H__ */
