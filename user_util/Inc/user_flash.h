#ifndef USER_FLASH_H
#define USER_FLASH_H

#include "stm32l0xx_hal_flash.h"
#include "user_util.h"

/* External variables --------------------------------------------------------*/
extern HAL_StatusTypeDef FLASH_WaitForLastOperation(uint32_t Timeout);
/* Define --------------------------------------------------------------------*/
#if defined (STM32L072xx) || defined (STM32L082xx)
    extern void  FLASH_PageErase(uint32_t Page);
#endif

#define BYTE_TEMP_FIRST    0xAA

/* Exported functions prototypes ---------------------------------------------*/
HAL_StatusTypeDef	OnchipFlashWriteData (uint32_t Addr, uint8_t *dataAddr, uint32_t dataLen);
HAL_StatusTypeDef	OnchipFlashCopy (uint32_t sourceandress, uint32_t destinationandress, uint32_t data_length);
HAL_StatusTypeDef 	OnchipFlashPageErase (uint32_t pageaddress);
void                Erase_Firmware(uint32_t Add_Flash_update,uint32_t Total_page);
void                OnchipFlashReadData (uint32_t address,uint8_t *destination, uint16_t length_inByte);
uint8_t             Save_Array(uint32_t ADD, uint8_t* Buff, uint16_t length);
uint8_t             Save_Array_without_erase (uint32_t ADD, uint8_t* Buff, uint16_t length);

#endif /* USER_FLASH_H */
