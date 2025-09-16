#ifndef USER_INTERNAL_ONFLASH_H
#define USER_INTERNAL_ONFLASH_H

#include "user_flash.h"
#include "user_util.h"

/* Define --------------------------------------------------------------------*/
#if defined (STM32L072xx) || defined (STM32L082xx)
    #define ON_FLASH_BASE               0x08000000
    #define ADDR_FLASH_END              0x08030000

    /*========Add Firmware: Main + Update=========== */
	#ifdef DEVICE_TYPE_STATION
		#define	ADDR_MAIN_PROGRAM			0x08004000	        //42 Page cho chuong trinh chinh
		#define	ADDR_UPDATE_PROGRAM			0x08019000	        //42 page -> End Program = 0x0802E000

		/*========Add Record Mess ================ */
		#define	ADDR_SINGLE_START   		0x0802E000	        //1*256k -> Max 128 record
		#define	ADDR_SINGLE_STOP			0x0802E100

		#define	ADDR_MULTIPLE_START   		0x0802E100	        //3*256k -> Max 384 record
		#define	ADDR_MULTIPLE_STOP			0x0802E400

		#define	ADDR_MESSAGE_START   		0x0802E400	        //1*256k -> Max ? record
		#define	ADDR_MESSAGE_STOP			0x0802E500
	#else
		#define	ADDR_MAIN_PROGRAM			0x08004000
		#define	ADDR_UPDATE_PROGRAM			0x0800D000

		/*========Add Record Mess ================ */
		#define	ADDR_SINGLE_START   		0x08010000
		#define	ADDR_SINGLE_STOP			0x0801F000

		#define	ADDR_MULTIPLE_START   		0x0801F000
		#define	ADDR_MULTIPLE_STOP			0x08025000

		#define	ADDR_MESSAGE_START   		0x08025000
		#define	ADDR_MESSAGE_STOP			0x0802C000
	#endif
		/*=======Add Index Mess================ */
		#define	ADDR_INDEX_SINGLE_SEND 		0x0802E680
		#define	ADDR_INDEX_SINGLE_SAVE 		0x0802E700

		#define	ADDR_INDEX_MULTIPLE_SEND 	0x0802E780
		#define	ADDR_INDEX_MULTIPLE_SAVE 	0x0802E800

		#define	ADDR_INDEX_MESSAGE_SEND 	0x0802E880
		#define	ADDR_INDEX_MESSAGE_SAVE 	0x0802E900

		/* ============= Addr Meter config======== */
		#define	ADDR_FLAG_RESET		        0x0802ED00
		#define	ADDR_VNA_MEASURE			0x0802ED80
		#define	ADDR_VP_MEASURE				0x0802EE00
		#define	ADDR_BAT_MEASURE			0x0802EE80

		/* ============= Addr Modem config ======== */
		#define	ADDR_DCUID					0x0802F500
    	#define	ADDR_NETID					0x0802F580
    	#define	ADDR_FREQ_ACTIVE    	    0x0802F600
		#define	ADDR_DEVICE_TYPE    	    0x0802F680
		#define	ADDR_DEVICE_CONNECT    	    0x0802F700

	#ifdef DEVICE_TYPE_STATION
		#define	FLASH_MAX_SINGLE_SAVE		2
		#define	FLASH_MAX_MULTIPLE_SAVE		6
		#define	FLASH_MAX_MESSAGE_SAVE		2

		#define SIZE_DATA_SINGLE	        64
		#define SIZE_DATA_MULTIPLE	        128
		#define SIZE_DATA_MESSAGE	        64

		#define MAX_SIZE_FIRMWARE           84
		#define FIRMWARE_SIZE_PAGE	        MAX_SIZE_FIRMWARE * 1024 / FLASH_PAGE_SIZE
	#else
		#define	FLASH_MAX_SINGLE_SAVE		2
		#define	FLASH_MAX_MULTIPLE_SAVE		6
		#define	FLASH_MAX_MESSAGE_SAVE		2

		#define SIZE_DATA_SINGLE	        64
		#define SIZE_DATA_MULTIPLE	        128
		#define SIZE_DATA_MESSAGE	        64

		#define MAX_SIZE_FIRMWARE           84
		#define FIRMWARE_SIZE_PAGE	        MAX_SIZE_FIRMWARE * 1024 / FLASH_PAGE_SIZE
	#endif

#endif
#define _ON_FLASH_IS_NEW_PAGE(address)     \
                    ((address - ON_FLASH_BASE) % FLASH_PAGE_SIZE)

/* Exported struct -----------------------------------------------------------*/
typedef struct
{
	uint16_t        IndexSend_u16;                  //vi tri doc ra va gui
    uint16_t        IndexSave_u16;                  //vi tri luu tiep theo

    uint32_t        AddStart_u32;
    uint32_t        AddStop_u32;

    uint16_t        MaxRecord_u16;                  //Max record Save in Flash
    uint16_t        SizeRecord_u16;                 //Size record

    uint32_t        AddIndexSend_u32;               //Add luu index send
    uint32_t        AddIndexSave_u32;

    uint16_t        CountMessReaded_u16;
    uint16_t        CountMessPacket_u16;            //So ban tin doc ra de dong goi

} StructManageRecordFlash;

/* Exported functions prototypes ---------------------------------------------*/
uint8_t     Flash_Check_Have_Packet (uint8_t IndexSend, uint8_t IndexSave);
void        Flash_Save_U16 (uint32_t andress, uint16_t Num);

uint8_t     Flash_Read_Record (uint32_t andress, sData* str, uint8_t IndexMess);
uint8_t     Flash_Read_Record_Without_Index (uint32_t andress, sData* str);

uint8_t     Flash_Read_Last_Record (StructManageRecordFlash sRecord, uint32_t *LastPulse, ST_TIME_FORMAT *LastSTime);
uint8_t     Flash_Save_Record (StructManageRecordFlash *sRecord, uint8_t *pData, uint8_t Length);

void        Flash_Save_Index (uint32_t Add, uint16_t Value);
void        Flash_Init_Record_Index (StructManageRecordFlash *sRecord);
void        Flash_Get_Infor (uint32_t AddStart, uint8_t *pData, uint16_t *Length, uint8_t MAX_LEGNTH_INFOR);

#endif /* USER_INTERNAL_ONFLASH_H */
