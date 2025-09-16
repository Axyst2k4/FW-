/**
  * @file    i2c.c
  * @brief   This file provides code for the configuration
  *          of the I2C instances.
  */

/* Includes ------------------------------------------------------------------*/
#include "i2c.h"

I2C_HandleTypeDef hi2c1;

void MX_I2C1_Init(void)
{
  hi2c1.Instance = I2C1;
  hi2c1.Init.Timing = 0x00000708;
  hi2c1.Init.OwnAddress1 = 0;
  hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
  hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
  hi2c1.Init.OwnAddress2 = 0;
  hi2c1.Init.OwnAddress2Masks = I2C_OA2_NOMASK;
  hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
  hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;
  if (HAL_I2C_Init(&hi2c1) != HAL_OK)
  {
    Error_Handler();
  }
}

void HAL_I2C_MspInit(I2C_HandleTypeDef* i2cHandle)
{

	#ifdef DEVICE_TYPE_STATION
	#else
		GPIO_InitTypeDef GPIO_InitStruct = {0};
	#endif

  if(i2cHandle->Instance==I2C1)
  {
	#ifdef DEVICE_TYPE_STATION
	#else
		__HAL_RCC_GPIOB_CLK_ENABLE();
		/**I2C1 GPIO Configuration
		PB8     ------> I2C1_SCL
		PB9     ------> I2C1_SDA
		*/
		GPIO_InitStruct.Pin = RTC_SCL_Pin|RTC_SDA_Pin;
		GPIO_InitStruct.Mode = GPIO_MODE_AF_OD;
		GPIO_InitStruct.Pull = GPIO_NOPULL;
		GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
		GPIO_InitStruct.Alternate = GPIO_AF4_I2C1;
		HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);

		__HAL_RCC_I2C1_CLK_ENABLE();
	#endif
  }
}

void HAL_I2C_MspDeInit(I2C_HandleTypeDef* i2cHandle)
{

  if(i2cHandle->Instance==I2C1)
  {
	#ifdef DEVICE_TYPE_STATION
	#else
		__HAL_RCC_I2C1_CLK_DISABLE();
		/**I2C1 GPIO Configuration
		PB8     ------> I2C1_SCL
		PB9     ------> I2C1_SDA
		*/
		HAL_GPIO_DeInit(RTC_SCL_GPIO_Port, RTC_SCL_Pin);
		HAL_GPIO_DeInit(RTC_SDA_GPIO_Port, RTC_SDA_Pin);
	#endif
  }
}
