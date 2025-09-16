#ifndef USER_ADC_H
#define USER_ADC_H

#include "stm32l0xx_hal_adc_ex.h"

#include "adc.h"
#include "user_util.h"

/* Define --------------------------------------------------------------------*/
#define hadc1               hadc
#define VREF				((uint32_t) 3000)
#define LEVEL_MAX_BAT		100

/* External variables --------------------------------------------------------*/
extern uint8_t      AdcInitialized;

/* Exported functions prototypes ---------------------------------------------*/
uint16_t        HW_AdcReadChannel(uint32_t Channel);
uint16_t 		Get_Vol_VNA (void);
uint16_t 		Get_Vol_VP (void);
uint8_t 		Get_Vol_BAT (void);
void            ADC_Desequence_Powerhungry_Channels (void);
void            STM32_MX_ADC1_Init(void);
uint16_t        Get_Level_Voltage (uint32_t Vol_mV, uint32_t VMAX, uint32_t VMIN);

#endif /* USER_ADC_H */
